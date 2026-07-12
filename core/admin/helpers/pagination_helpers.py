import math
from rest_framework.pagination import PageNumberPagination, CursorPagination
from rest_framework.response import Response


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        count = self.page.paginator.count
        current_page = self.page.number
        per_page = self.page.paginator.per_page
        
        # Calculate range: "showing 1-20 of 100"
        start_index = (current_page - 1) * per_page + 1
        end_index = min(current_page * per_page, count)
        range_info = f"showing {start_index}-{end_index} of {count}"
        
        total_pages = math.ceil(count / per_page)
        
        return Response(
            {
                "success": True,
                "count": count,
                "total_pages": total_pages,
                "current_page": current_page,
                "range": range_info,
                "next_url": self.get_next_link(),
                "prev_url": self.get_previous_link(),
                "has_next": self.page.has_next(),
                "has_prev": self.page.has_previous(),
                "results": data,
            }
        )


class IndustrialCursorPagination(CursorPagination):
    """
    High-performance pagination for large datasets.
    Does NOT provide total count (for O(1) performance).
    """
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100
    cursor_query_param = "cursor"
    ordering = "-created_at"  # Default ordering

    def get_paginated_response(self, data):
        next_link = self.get_next_link()
        prev_link = self.get_previous_link()
        
        return Response(
            {
                "success": True,
                "next_url": next_link,
                "prev_url": prev_link,
                "has_next": next_link is not None,
                "has_prev": prev_link is not None,
                "results": data,
            }
        )


def paginate_queryset(pagination_class, queryset, request, view):
    paginator = pagination_class()
    
    # Handle dynamic ordering for CursorPagination if needed
    if isinstance(paginator, CursorPagination):
        sort_param = request.query_params.get("sort")
        if sort_param:
            paginator.ordering = sort_param
            
    paginated = paginator.paginate_queryset(queryset, request, view=view)
    return paginated, paginator