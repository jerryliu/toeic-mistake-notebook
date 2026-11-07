import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/current-user.decorator';
import { ConfirmQuestionDto } from './dto/confirm-question.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionsService } from './questions.service';

const uploadRoot = join(process.cwd(), 'uploads');
if (!existsSync(uploadRoot)) {
  mkdirSync(uploadRoot, { recursive: true });
}

@ApiTags('questions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @ApiOkResponse({ description: 'List recent questions' })
  list(@CurrentUser() user: AuthUser) {
    return this.questionsService.list(user.id);
  }

  @Post()
  @ApiOkResponse({ description: 'Create question from pasted text' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateQuestionDto) {
    return this.questionsService.createFromPaste(user.id, dto);
  }

  @Post('ocr')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadRoot,
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname) || '.png';
          cb(null, `${uuidv4()}${ext}`);
        },
      }),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  async ocr(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      return { message: '請上傳截圖檔案' };
    }
    const imageUrl = `/uploads/${file.filename}`;
    return this.questionsService.createFromOcrUpload({
      userId: user.id,
      imageUrl,
      imagePath: file.path,
    });
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.questionsService.getDetail(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(id, user.id, dto);
  }

  @Post(':id/analyze')
  analyze(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.questionsService.analyze(id, user.id);
  }

  @Post(':id/confirm')
  confirm(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: ConfirmQuestionDto,
  ) {
    return this.questionsService.confirm(id, user.id, dto);
  }
}
