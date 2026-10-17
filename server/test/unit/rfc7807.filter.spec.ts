import { ArgumentsHost, BadRequestException, HttpStatus, NotFoundException } from '@nestjs/common';
import { Rfc7807ExceptionFilter } from '../../src/common/filters/rfc7807-exception.filter';

describe('Rfc7807ExceptionFilter', () => {
  let filter: Rfc7807ExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new Rfc7807ExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      contentType: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/v1/mail/threads/unknown-id',
      originalUrl: '/v1/mail/threads/unknown-id',
    };

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should format NotFoundException into RFC 7807 problem details', () => {
    const exception = new NotFoundException('Thread not found');

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.contentType).toHaveBeenCalledWith('application/problem+json');
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'https://api.inboxcompanion.app/errors/not-found',
        title: 'NotFoundException',
        status: 404,
        detail: 'Thread not found',
        instance: '/v1/mail/threads/unknown-id',
        code: 'NOT_FOUND',
      }),
    );
  });

  it('should format validation errors into structured errors map', () => {
    const exception = new BadRequestException({
      message: ['subject must not be empty', 'to must contain at least 1 recipient'],
    });

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.contentType).toHaveBeenCalledWith('application/problem+json');
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'BadRequestException',
        status: 400,
        code: 'VALIDATION_ERROR',
        errors: {
          subject: ['subject must not be empty'],
          to: ['to must contain at least 1 recipient'],
        },
      }),
    );
  });
});
