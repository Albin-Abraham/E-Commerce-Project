import mimetypes
import os

from django.core.exceptions import ValidationError


class DocumentValidator:
    @staticmethod
    def validate_file(file_obj, definition) -> None:
        """
        Validates a file upload against a DocumentDefinition's storage constraints.
        Raises ValidationError if validation fails.
        """
        if definition.max_file_size is not None and file_obj.size > definition.max_file_size:
            raise ValidationError(
                f"File size ({file_obj.size} bytes) exceeds maximum limit "
                f"of {definition.max_file_size} bytes."
            )

        filename = file_obj.name or ""
        _, ext = os.path.splitext(filename.lower())
        content_type = getattr(file_obj, "content_type", "")

        if definition.allowed_extensions:
            allowed_exts = [
                e.lower() if e.startswith(".") else f".{e.lower()}"
                for e in definition.allowed_extensions
            ]
            if ext not in allowed_exts:
                raise ValidationError(
                    f"File extension '{ext}' is not allowed. "
                    f"Allowed extensions: {', '.join(definition.allowed_extensions)}"
                )

        if definition.allowed_mime_types and content_type not in definition.allowed_mime_types:
            raise ValidationError(
                f"File MIME type '{content_type}' is not allowed. "
                f"Allowed MIME types: {', '.join(definition.allowed_mime_types)}"
            )

        guessed_type, _ = mimetypes.guess_type(filename)
        if guessed_type and content_type and guessed_type != content_type:
            is_pdf_spoof = ext == ".pdf" and "pdf" not in content_type
            is_img_spoof = ext in [".png", ".jpg", ".jpeg"] and "image" not in content_type

            if is_pdf_spoof or is_img_spoof:
                raise ValidationError(
                    f"File type spoofing detected. Extension '{ext}' does not match "
                    f"MIME type '{content_type}'."
                )
