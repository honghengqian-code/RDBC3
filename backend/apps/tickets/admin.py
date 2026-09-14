from django.contrib import admin

from apps.tickets.models import Client, Response, Ticket


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ["email", "name", "token", "created_at"]
    search_fields = ["email", "name"]


class ResponseInline(admin.TabularInline):
    model = Response
    extra = 0
    readonly_fields = ["created_at"]


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ["title", "client", "status", "priority", "created_at", "resolved_at"]
    list_filter = ["status", "priority"]
    search_fields = ["title", "client__email", "client__name", "token"]
    inlines = [ResponseInline]


@admin.register(Response)
class ResponseAdmin(admin.ModelAdmin):
    list_display = ["ticket", "author_type", "created_at"]
