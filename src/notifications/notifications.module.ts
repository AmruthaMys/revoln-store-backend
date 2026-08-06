import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { join } from 'path';

import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EmailService } from './email.service';
import { MailerService as CustomMailerService } from './mailer.service';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('MAIL_HOST');
        const port = Number(config.get<number>('MAIL_PORT')) || 587;
        const user = config.get<string>('MAIL_USER');
        const pass = config.get<string>('MAIL_PASSWORD');

        const transport = host && user && pass
          ? {
              host,
              port,
              secure: false,
              auth: {
                user,
                pass,
              },
            }
          : {
              streamTransport: true,
              newline: 'unix',
              buffer: true,
            };

        return {
          transport,
          defaults: {
            from: config.get<string>('MAIL_FROM') ?? '"REVOLN" <noreply@revoln.in>',
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailService, CustomMailerService],
  exports: [NotificationsService, EmailService, CustomMailerService],
})
export class NotificationsModule {}
