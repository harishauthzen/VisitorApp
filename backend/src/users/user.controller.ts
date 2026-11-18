import {Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './user.service.js';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto } from './dto/createUser.dto.js';

@Controller('user')
@UseGuards(AuthGuard(['user-jwt', 'admin-jwt']))
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get('profile')
  getUser(@Req() req: any) {
    return this.usersService.getUser(req.user.id);
  }

  @Patch('details')
  addDetails(@Req() req: any , @Body() dto: CreateUserDto){
    return this.usersService.addDetails(req.user.id , dto);
  }

  @Get('registered-events')
  getRegisteredEvents(@Req() req: any) {
    return this.usersService.getRegisteredEvents(req.user.id);
  }

  @Get("registered-events/:id")
  getRegistrationById(@Req() req: any, @Param('id') id: number) {
    return this.usersService.getRegisteredEventDetails(req.user.id, id);
  }

  // @Post()
  // createUser(@Body() createUserDto : CreateUserDto) {
  //   // console.log('createUserDto controller:>> ', createUserDto);
  //   return this.usersService.createUser(createUserDto);
  // }
}
