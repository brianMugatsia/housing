from django.contrib import admin
from .models import User, University, StudentProfile, LandlordProfile

admin.site.register(User)
admin.site.register(University)
admin.site.register(StudentProfile)
admin.site.register(LandlordProfile)