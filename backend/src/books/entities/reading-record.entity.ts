import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Book } from './book.entity';

export type ReadingStatus = 'pendiente' | 'leyendo' | 'leido' | 'dnf';

@Entity('reading_records')
export class ReadingRecord {
  @PrimaryColumn({ name: 'book_id', type: 'uuid' })
  bookId: string;

  @OneToOne(() => Book, (book) => book.readingRecord, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @Column({ type: 'varchar', length: 20 })
  status: ReadingStatus;

  @Column({ name: 'current_page', type: 'int', nullable: true })
  currentPage: number | null;

  @Column({
    name: 'progress_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  progressPercent: string | null;

  @Column({
    type: 'decimal',
    precision: 2,
    scale: 1,
    nullable: true,
  })
  rating: string | null;

  @Column({ name: 'read_format', type: 'varchar', length: 20, nullable: true })
  readFormat: string | null;

  @Column({ name: 'started_on', type: 'date', nullable: true })
  startedOn: string | null;

  @Column({ name: 'finished_on', type: 'date', nullable: true })
  finishedOn: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
