import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateEventDto } from './dto/create-event.dto.js';
import { CreateEventPassDto } from './dto/create-event-pass.dto.js';
import { CreateRegistrationDto } from './dto/create-registration.dto.js';
import { EventService } from './event.service.js';
import { AdminAuthGuard } from '../auth/guards/admin-guards.js';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) { }

  @Post()
  @UseGuards(AdminAuthGuard)
  createEvent(@Body() dto: CreateEventDto) {
    return this.eventService.createEvent(dto);
  }

  @Get()
  getEvents() {
    return this.eventService.getEvents();
  }

  @Get('dashboard/summary')
  @UseGuards(AdminAuthGuard)
  getDashboardSummary() {
    return this.eventService.getAdminDashboardSummary();
  }

  @Get("registrations")
  @UseGuards(AdminAuthGuard)
  getAllRegistrations() {
    return this.eventService.getAllRegistrations();
  }

  @Get("registrations/deleted")
  @UseGuards(AdminAuthGuard)
  getAllDeletedRegistrations() {
    return this.eventService.getAllDeletedRegistrations();
  }

  @Post('registrations/verify-qr')
  @UseGuards(AdminAuthGuard)
  async verifyQr(@Body('qrToken') qrToken: string, @Req() req: any,) {
    return this.eventService.verifyQr(qrToken, req.user.id,);
  }

  @Get('registrations/scan-count')
  @UseGuards(AdminAuthGuard)
  async scanCount() {
    return this.eventService.scanCount();
  }

  @Get('registrations/:id')
  @UseGuards(AdminAuthGuard)
  getRegistrationById(@Param('id', ParseIntPipe) id: number) {
    return this.eventService.getRegistrationById(id);
  }

  @Delete('registrations/:id')
  @UseGuards(AdminAuthGuard)
  softDeleteRegistration(@Param('id', ParseIntPipe) registrationID: number) {
    return this.eventService.softDeleteRegistration(registrationID);
  }

  @Patch('registrations/:id/restore')
  @UseGuards(AdminAuthGuard)
  restoreRegistration(@Param('id', ParseIntPipe) registrationID: number) {
    return this.eventService.restoreRegistration(registrationID);
  }

  @Delete('registrations/:id/permanent')
  @UseGuards(AdminAuthGuard)
  permanentlyDeleteRegistration(@Param('id', ParseIntPipe) registrationID: number) {
    return this.eventService.permanentlyDeleteRegistration(registrationID);
  }

  @Get('deleted')
  @UseGuards(AdminAuthGuard)
  getAllDeletedEvents(){
    return this.eventService.getAllDeletedEvents();
  }

  @Get('passes/deleted')
  @UseGuards(AdminAuthGuard)
  getDeletedPasses() {
    return this.eventService.getDeletedPasses();
  }

  @Get(':id')
  getEventById(@Param('id', ParseIntPipe) id: number) {
    return this.eventService.getEventById(id);
  }

  @Patch(':id')
  @UseGuards(AdminAuthGuard)
  updateEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateEventDto>,
  ) {
    return this.eventService.updateEvent(id, dto);
  }

  // @Delete(':id')
  // @UseGuards(AdminAuthGuard)
  // deleteEvent(@Param('id', ParseIntPipe) id: number) {
  //   return this.eventService.deleteEvent(id);
  // }
  @Delete(':id')
  @UseGuards(AdminAuthGuard)
  softDeleteEvent(@Param('id', ParseIntPipe) id: number) {
    return this.eventService.softDeleteEvent(id);
  }

  @Delete(':id/permanent')
  @UseGuards(AdminAuthGuard)
  permanentlyDeleteEvent(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.eventService.permanentlyDeleteEvent(id);
  }

  @Patch(':id/restore')
  @UseGuards(AdminAuthGuard)
  restoreEvent(@Param('id', ParseIntPipe) id: number) {
    return this.eventService.restoreEvent(id);
  }

  @Post(':id/passes')
  @UseGuards(AdminAuthGuard)
  createPass(
    @Param('id', ParseIntPipe) eventId: number,
    @Body() dto: CreateEventPassDto,
  ) {
    return this.eventService.createPass(eventId, dto);
  }

  @Get(':id/passes')
  getPasses(@Param('id', ParseIntPipe) eventId: number) {
    return this.eventService.getPasses(eventId);
  }

  @Patch(':id/passes/:passId')
  @UseGuards(AdminAuthGuard)
  updatePass(
    @Param('id', ParseIntPipe) eventId: number,
    @Param('passId', ParseIntPipe) passId: number,
    @Body() dto: Partial<CreateEventPassDto>,
  ) {
    return this.eventService.updatePass(eventId, passId, dto);
  }

  // @Delete(':id/passes/:passId')
  // @UseGuards(AdminAuthGuard)
  // deletePass(
  //   @Param('id', ParseIntPipe) eventId: number,
  //   @Param('passId', ParseIntPipe) passId: number,
  // ) {
  //   return this.eventService.deletePass(eventId, passId);
  // }
  @Delete(':id/passes/:passId')
  @UseGuards(AdminAuthGuard)
  softDeletePass(
    @Param('passId', ParseIntPipe) passId: number,
  ) {
    return this.eventService.softDeletePass(passId);
  }

  @Patch(':id/passes/:passId/restore')
  @UseGuards(AdminAuthGuard)
  restorePass(@Param('passId', ParseIntPipe) passId: number) {
    return this.eventService.restorePass(passId);
  }

  @Delete(':id/passes/:passId/permanent')
  @UseGuards(AdminAuthGuard)
  permanentlyDeletePass(@Param('passId', ParseIntPipe) passId: number) {
    return this.eventService.permanentlyDeletePass(passId);
  }

  @Post(':id/register')
  @UseGuards(AuthGuard(['user-jwt', 'admin-jwt']))
  createRegistration(
    @Req() req: any,
    @Param('id', ParseIntPipe) eventId: number,
    @Body() dto: CreateRegistrationDto,
  ) {
    return this.eventService.createRegistration({
      ...dto,
      eventId,
    }, req.user.id);
  }

  @Get(':id/registrations')
  @UseGuards(AdminAuthGuard)
  getRegistrations(@Param('id', ParseIntPipe) eventId: number) {
    return this.eventService.findRegistrationsByEvent(eventId);
  }

  
}
