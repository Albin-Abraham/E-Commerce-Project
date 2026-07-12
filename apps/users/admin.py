from django.contrib import admin
from apps.users.models.users import UserModel, UserProfileModel
# Register your models here.
admin.site.register(UserModel)
admin.site.register(UserProfileModel)