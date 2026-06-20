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
      host: 'localhost',
      port: 5432,
      username: 'librarian',
      password: 'restoration2024',
      database: 'ancient_books',
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
