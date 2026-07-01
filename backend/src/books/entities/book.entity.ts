import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { ReadingRecord } from './reading-record.entity';

export type DataSourceType =
  | 'open_library'
  | 'google_books'
  | 'goodreads'
  | 'manual';

export type AudienceType = 'young_adult' | 'new_adult' | 'adult';

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.books, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  authors: string;

  @Column({ name: 'isbn_13', type: 'varchar', length: 13, nullable: true })
  isbn13: string | null;

  @Column({ name: 'isbn_10', type: 'varchar', length: 10, nullable: true })
  isbn10: string | null;

  @Column({ name: 'cover_image_url', type: 'text', nullable: true })
  coverImageUrl: string | null;

  @Column({ name: 'page_count', type: 'int', nullable: true })
  pageCount: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  genre: string | null;

  @Column({ name: 'series_name', type: 'varchar', length: 255, nullable: true })
  seriesName: string | null;

  @Column({ name: 'publication_year', type: 'smallint', nullable: true })
  publicationYear: number | null;

  @Column({ name: 'data_source', type: 'varchar', length: 32 })
  dataSource: DataSourceType;

  @Column({ name: 'external_provider_id', type: 'varchar', length: 128, nullable: true })
  externalProviderId: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  audience: AudienceType | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => ReadingRecord, (reading) => reading.book)
  readingRecord: ReadingRecord;
}
