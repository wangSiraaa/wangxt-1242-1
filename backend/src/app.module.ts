import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  User,
  AncientBook,
  Material,
  RestorationRequest,
  RestorationStep,
  BookImage,
  ExpertReview,
  BorrowingRestriction,
  BorrowingRecord,
} from './entities';
import {
  BusinessRulesService,
  AncientBookService,
  RestorationRequestService,
  RestorationStepService,
  ExpertReviewService,
  MaterialService,
  BookImageService,
  UserService,
} from './services';
import {
  AncientBookController,
  RestorationRequestController,
  RestorationStepController,
  ExpertReviewController,
  MaterialController,
  BookImageController,
  UserController,
  BusinessRulesController,
} from './controllers';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USER || 'librarian',
      password: process.env.DB_PASSWORD || 'restoration2024',
      database: process.env.DB_NAME || 'ancient_books',
      entities: [
        User,
        AncientBook,
        Material,
        RestorationRequest,
        RestorationStep,
        BookImage,
        ExpertReview,
        BorrowingRestriction,
        BorrowingRecord,
      ],
      synchronize: false,
      logging: true,
      ssl: false,
    }),
    TypeOrmModule.forFeature([
      User,
      AncientBook,
      Material,
      RestorationRequest,
      RestorationStep,
      BookImage,
      ExpertReview,
      BorrowingRestriction,
      BorrowingRecord,
    ]),
  ],
  controllers: [
    AncientBookController,
    RestorationRequestController,
    RestorationStepController,
    ExpertReviewController,
    MaterialController,
    BookImageController,
    UserController,
    BusinessRulesController,
  ],
  providers: [
    BusinessRulesService,
    AncientBookService,
    RestorationRequestService,
    RestorationStepService,
    ExpertReviewService,
    MaterialService,
    BookImageService,
    UserService,
  ],
})
export class AppModule {}
