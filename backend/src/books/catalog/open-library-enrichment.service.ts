import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { CatalogEditionDto } from '../dto/catalog-edition.dto';
import {
  OlEditionEntry,
  OlSearchDocFields,
  OlWorkDetail,
  resolveGenre,
  resolvePageCount,
} from './open-library-enrichment';

@Injectable()
export class OpenLibraryEnrichmentService {
  constructor(private readonly http: HttpService) {}

  async enrichSearchDoc(doc: OlSearchDocFields, base: CatalogEditionDto): Promise<CatalogEditionDto> {
    const workKey = doc.key?.startsWith('/works/') ? doc.key : null;
    if (!workKey) return base;

    const [work, editions] = await Promise.all([
      this.fetchWork(workKey),
      this.fetchEditions(workKey),
    ]);

    const genre = resolveGenre(
      work?.subjects,
      doc.subject,
      doc.series_name,
    );
    const page_count = resolvePageCount(
      doc.number_of_pages_median,
      doc.cover_edition_key,
      editions,
    );

    return {
      ...base,
      genre: genre ?? base.genre,
      page_count: page_count ?? base.page_count,
    };
  }

  async enrichEdition(dto: CatalogEditionDto): Promise<CatalogEditionDto> {
    if (dto.data_source !== 'open_library') return dto;
    if (dto.genre && dto.page_count) return dto;

    const workKey = dto.external_provider_id.startsWith('/works/')
      ? dto.external_provider_id
      : null;

    if (workKey) {
      const [work, editions] = await Promise.all([
        this.fetchWork(workKey),
        this.fetchEditions(workKey),
      ]);
      return {
        ...dto,
        genre:
          dto.genre ??
          resolveGenre(work?.subjects, undefined, undefined) ??
          null,
        page_count:
          dto.page_count ??
          resolvePageCount(undefined, undefined, editions) ??
          null,
      };
    }

    if (dto.external_provider_id.startsWith('/books/')) {
      const edition = await this.fetchEdition(dto.external_provider_id);
      return {
        ...dto,
        page_count: dto.page_count ?? edition?.number_of_pages ?? null,
        genre:
          dto.genre ??
          resolveGenre(edition?.subjects, undefined, edition?.series) ??
          null,
      };
    }

    return dto;
  }

  private async fetchWork(workKey: string): Promise<OlWorkDetail | null> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<OlWorkDetail>(`https://openlibrary.org${workKey}.json`),
      );
      return data;
    } catch {
      return null;
    }
  }

  private async fetchEditions(workKey: string): Promise<OlEditionEntry[]> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<{ entries?: OlEditionEntry[] }>(
          `https://openlibrary.org${workKey}/editions.json`,
          { params: { limit: 20 } },
        ),
      );
      return data.entries ?? [];
    } catch {
      return [];
    }
  }

  private async fetchEdition(editionKey: string): Promise<OlEditionEntry | null> {
    try {
      const key = editionKey.startsWith('/') ? editionKey : `/${editionKey}`;
      const { data } = await firstValueFrom(
        this.http.get<OlEditionEntry>(`https://openlibrary.org${key}.json`),
      );
      return data;
    } catch {
      return null;
    }
  }
}
