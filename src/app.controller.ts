import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  health() {
    return {
      success: true,
      message: 'REVOLN API is running',
    };
  }
}