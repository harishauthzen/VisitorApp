import {Module} from "@nestjs/common";
import {HttpModule} from '@nestjs/axios'
import { RequestSigningService } from "./services/signing.services.js";
import {OvseService} from './services/ovse.services.js';
import { OvseVerification } from "./services/ovse.entity.js";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports : [HttpModule,
        TypeOrmModule.forFeature([OvseVerification])
    ],
    providers : [RequestSigningService,OvseService],
    exports : [RequestSigningService , OvseService]
})

export class CommonModule {}