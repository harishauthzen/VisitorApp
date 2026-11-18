import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './user.entity.js';
import { CreateUserDto } from './dto/createUser.dto.js';
import { EventRegistration } from '../events/event-registration.entity.js';

type UserProfile = Pick<
    User,
    'id' | 'email' | 'phone' | 'firstName' | 'lastName' | 'gender' | 'city' | 'company'
>;

function toUserProfile(user: User): UserProfile {
    return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
        city: user.city,
        company: user.company,
    };
}

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(EventRegistration)
        private readonly registrationRepository: Repository<EventRegistration>,
    ) { }

    async getUser(userId: number) {
        if (!this.userRepository) {
            throw new Error('User repository is not configured');
        }

        const user = await this.userRepository.findOne({
            where: {
                id: userId
            }
        });

        if (!user) {
            return {
                success: false,
                message: "User not found"
            }
        }
        return toUserProfile(user);
    }

    async addDetails(id: number, dto: CreateUserDto): Promise<UserProfile> {
        if (!this.userRepository) {
            throw new Error('User repository is not configured');
        }
        const user = await this.userRepository.findOne({
            where: {
                id: id
            }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        Object.assign(user, dto);
        const savedUser = await this.userRepository.save(user);
        return toUserProfile(savedUser);

        // const updateResult = await this.userRepository.update(id, {
        //     firstName: dto.firstName,
        //     lastName: dto.lastName,
        //     gender: dto.gender,
        //     city: dto.city,
        //     company: dto.company,
        // });

        // if (updateResult.affected === 0) {
        //     throw new Error('User details update failed');
        // }

        // console.log("updateResult :>> ", updateResult);

        // return {
        //     success: true,
        //     message: 'User details updated successfully'
        // }
    }


    async getRegisteredEvents(userId: number) {
        const registratedEvents = await this.registrationRepository.find({
            where: {
                userId: userId
            },
            relations: { event: true, pass: true }
        });

        if (!registratedEvents || registratedEvents.length === 0) {
            return {
                success: false,
                message: "No registered events found"
            }
        }

        const events = registratedEvents.map((registration) => ({
            id: registration.id,
            eventId: registration.eventId,
            userId: registration.userId,
            attendeeName: registration.attendeeName,
            phone: registration.phone,
            event: {
                id: registration.eventId,
                name: registration.event?.name ??
                    registration.eventNameSnapshot ??
                    'Deleted event',
            },
            pass: {
                name: registration.pass?.name ??
                    registration.passNameSnapshot ??
                    'Deleted pass',
                price: registration.pass?.price ??
                    registration.passPriceSnapshot,
            },
            amount: registration.amount,
            selectedDate: registration.selectedDate,
            status: registration.status,
            quantity: registration.quantity,
        }));

        return events;
    }

    async getRegisteredEventDetails(userId: number, registrationId: number) {
        const registration = await this.registrationRepository.findOne({
            where: {
                id: registrationId,
            },
            relations: { event: true, pass: true }
        });

        if (!registration || registration.userId !== userId) {
            throw new Error('Registration not found or access denied');
        }

        const registrationDetails = {
            id: registration.id,
            eventId: registration.eventId,
            userId: registration.userId,
            attendeeName: registration.attendeeName,
            email: registration.email,
            phone: registration.phone,
            event: {
                id: registration.eventId,
                name: registration.event?.name ??
                    registration.eventNameSnapshot ??
                    'Deleted event',
            },
            pass: {
                name: registration.pass?.name ??
                    registration.passNameSnapshot ??
                    'Deleted pass',
                price: registration.pass?.price ??
                    registration.passPriceSnapshot,
            },
            amount: registration.amount,
            selectedDate: registration.selectedDate,
            status: registration.status,
            quantity: registration.quantity,
            qrToken: registration.status === 'confirmed' ? registration.qrToken : undefined,
            createdAt: registration.createdAt,
        }

        return registrationDetails;
    }

    // async createUser(createUserDto: CreateUserDto) {

    //     try {
    //         console.log('createUserDto service:>> ', createUserDto);
    //         const existingUser = await this.userRepository.findOne({
    //             where: {
    //                 email: createUserDto.email,
    //                 phone: createUserDto.phone
    //             },
    //         });

    //         console.log('existingUser :>> ', existingUser);

    //         if (existingUser) {
    //             throw new ConflictException(
    //                 'User already exists with same email or phone number',
    //             );
    //         }

    //         const verifiedUser = await this.otpRepository.findOne({
    //             where: {
    //                 email: createUserDto.email,
    //                 phone: createUserDto.phone,
    //                 verified: true
    //             }
    //         })

    //         if (!verifiedUser) {
    //             return {
    //                 success: false,
    //                 message: "Email or Phone number not verified"
    //             }
    //         }
    //         const user = this.userRepository.create({
    //             ...createUserDto,
    //             emailVerified: true,
    //             phoneVerified: true,
    //         });

    //         return await this.userRepository.save(user);

    //     } catch (error) {
    //         return {
    //             success: false,
    //             message: "server error! Try again",
    //             error: error
    //         }
    //     }
    // }

    async findByEmail(email: string) {
        return await this.userRepository.findOne({
            where: {
                email: email
            }
        });
    }
}
