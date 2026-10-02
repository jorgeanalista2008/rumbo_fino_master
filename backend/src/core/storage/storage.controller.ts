import { Controller, Get, Param, Res, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { StorageService } from './storage.service';

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get('files/:id')
  @ApiOperation({ summary: 'Obtener y visualizar un archivo/fotografía almacenado (Público)' })
  @ApiParam({ name: 'id', description: 'UUID del archivo almacenado' })
  async getFile(@Param('id') id: string, @Res() res: Response) {
    const file = await this.storageService.getFile(id);

    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', file.fileSize || file.data.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);

    return res.end(file.data);
  }
}
