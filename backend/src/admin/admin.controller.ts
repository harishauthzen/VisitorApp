import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/guards/admin-guards.js';

@Controller('admin')
@UseGuards(AdminAuthGuard)
export class AdminController {
    @Get()
    getDashboard() {
        return {
            success: true,
            message: 'Welcome Admin',
        };
    }
}