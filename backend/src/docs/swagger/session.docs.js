// src/docs/swagger/session.docs.js

export const sessionPaths = {
  '/api/v1/sessions/refresh': {
    'post': {
      'tags': ['Sessions'],
      'summary': 'Refresh a session (extend expiry)',
      'security': [{ 'bearerAuth': [] }],
      'requestBody': {
        'required': true,
        'content': {
          'application/json': {
            'schema': {
              'type': 'object',
              'properties': {
                'session_id': {
                  'type': 'string',
                  'description': 'ID of the session to refresh'
                }
              },
              'required': ['session_id']
            }
          }
        }
      },
      'responses': {
        '200': {
          'description': 'Session refreshed successfully',
          'content': {
            'application/json': {
              'example': {
                'status': 'success',
                'data': {
                  'session_id': 'abc123',
                  'user_id': 'usr456',
                  'expires_at': '2025-12-31T23:59:59.000Z'
                },
                'message': 'Session refreshed successfully'
              }
            }
          }
        },
        '400': { 'description': 'Invalid session_id' },
        '401': { 'description': 'Unauthorized' },
        '500': { 'description': 'Internal server error' }
      }
    }
  },

  '/api/v1/sessions/revoke/{id}': {
    'post': {
      'tags': ['Sessions'],
      'summary': 'Revoke a specific session by ID',
      'security': [{ 'bearerAuth': [] }],
      'parameters': [
        {
          'name': 'id',
          'in': 'path',
          'required': true,
          'schema': { 'type': 'string' },
          'description': 'ID of the session to revoke'
        }
      ],
      'responses': {
        '200': {
          'description': 'Session revoked successfully',
          'content': {
            'application/json': {
              'example': {
                'status': 'success',
                'data': {
                  'session_id': 'abc123',
                  'is_active': false,
                  'revoked_at': '2025-10-23T20:00:00.000Z'
                },
                'message': 'Session revoked successfully'
              }
            }
          }
        },
        '404': { 'description': 'Session not found or already revoked' },
        '401': { 'description': 'Unauthorized' },
        '500': { 'description': 'Internal server error' }
      }
    }
  },

  '/api/v1/sessions': {
    'get': {
      'tags': ['Sessions'],
      'summary': 'List all sessions with filters, search, and pagination',
      'security': [{ 'bearerAuth': [] }],
      'parameters': [
        {
          'name': 'user_id',
          'in': 'query',
          'schema': { 'type': 'string' },
          'description': 'Filter sessions for a specific user'
        },
        {
          'name': 'session_id',
          'in': 'query',
          'schema': { 'type': 'string' },
          'description': 'Filter by specific session ID'
        },
        {
          'name': 'tenant_id',
          'in': 'query',
          'schema': { 'type': 'string' },
          'description': 'Filter sessions belonging to a tenant'
        },
        {
          'name': 'search',
          'in': 'query',
          'schema': { 'type': 'string' },
          'description': 'Search sessions by username or email (partial, case-insensitive)'
        },
        {
          'name': 'status',
          'in': 'query',
          'schema': { 'type': 'string', 'enum': ['active', 'inactive'] },
          'description': 'Filter by session status'
        },
        {
          'name': 'page',
          'in': 'query',
          'schema': { 'type': 'integer', 'default': 1 },
          'description': 'Page number for pagination'
        },
        {
          'name': 'limit',
          'in': 'query',
          'schema': { 'type': 'integer', 'default': 10 },
          'description': 'Number of sessions per page'
        }
      ],
      'responses': {
        '200': {
          'description': 'Sessions retrieved successfully',
          'content': {
            'application/json': {
              'example': {
                'status': 'success',
                'data': [
                  {
                    'session_id': 'abc123',
                    'user_id': 'usr456',
                    'username': 'John Doe',
                    'email': 'john@example.com',
                    'tenant_id': 'tenant001',
                    'tenant_name': 'Acme Corp',
                    'ip_address': '192.168.0.1',
                    'device_name': 'Chrome on Windows',
                    'location': null,
                    'is_active': true,
                    'created_at': '2025-10-23T18:00:00.000Z',
                    'last_active_at': '2025-10-23T19:00:00.000Z'
                  }
                ],
                'pagination': {
                  'total': 100,
                  'page': 1,
                  'limit': 10,
                  'totalPages': 10
                }
              }
            }
          }
        },
        '401': { 'description': 'Unauthorized' },
        '500': { 'description': 'Internal server error' }
      }
    }
  },
  '/api/v1/sessions/logs': {
    'get': {
      'tags': ['Sessions'],
      'summary': 'Get session logs with filters, search, and pagination',
      'security': [{ 'bearerAuth': [] }],
      'parameters': [
        {
          'name': 'user_id',
          'in': 'query',
          'schema': { 'type': 'string' },
          'description': 'Filter logs for a specific user'
        },
        {
          'name': 'session_id',
          'in': 'query',
          'schema': { 'type': 'string' },
          'description': 'Filter logs for a specific session'
        },
        {
          'name': 'tenant_id',
          'in': 'query',
          'schema': { 'type': 'string' },
          'description': 'Filter logs belonging to a specific tenant'
        },
        {
          'name': 'search',
          'in': 'query',
          'schema': { 'type': 'string' },
          'description': 'Search by username or email (partial, case-insensitive)'
        },
        {
          'name': 'action',
          'in': 'query',
          'schema': { 'type': 'string' },
          'description': 'Filter logs by event/action type (e.g., login, logout, refresh)'
        },
        {
          'name': 'page',
          'in': 'query',
          'schema': { 'type': 'integer', 'default': 1 },
          'description': 'Page number for pagination'
        },
        {
          'name': 'limit',
          'in': 'query',
          'schema': { 'type': 'integer', 'default': 10 },
          'description': 'Number of logs per page'
        }
      ],
      'responses': {
        '200': {
          'description': 'Session logs retrieved successfully',
          'content': {
            'application/json': {
              'example': {
                'status': 'success',
                'data': [
                  {
                    'log_id': 'log123',
                    'session_id': 'sess456',
                    'user_id': 'usr789',
                    'username': 'John Doe',
                    'email': 'john@example.com',
                    'tenant_id': 'tenant001',
                    'event': 'logout',
                    'details': { 'reason': 'manual logout' },
                    'created_at': '2025-10-23T20:00:00.000Z'
                  }
                ],
                'pagination': {
                  'total': 50,
                  'page': 1,
                  'limit': 10,
                  'totalPages': 5
                }
              }
            }
          }
        },
        '401': { 'description': 'Unauthorized' },
        '500': { 'description': 'Internal server error' }
      }
    }
  }

}

export const sessionSchemas = {
  Device: {
    type: 'object',
    properties: {
      os: { type: 'string', example: 'Windows 10' },
      browser: { type: 'string', example: 'Firefox 144.0' },
      location: { type: 'string', example: null },
      app_version: { type: 'string', example: null },
      device_type: { type: 'string', example: 'web' },
      device_model: { type: 'string', example: 'Unknown Device' },
      device_vendor: { type: 'string', example: null },
      screen_resolution: { type: 'string', example: null }
    }
  },

  CreateSession: {
    type: 'object',
    required: ['user_id', 'tenant_id'],
    properties: {
      user_id: { type: 'string' },
      tenant_id: { type: 'string' },
      device: { $ref: '#/components/schemas/Device' }
    }
  },

  RefreshSession: {
    type: 'object',
    required: ['session_id'],
    properties: {
      session_id: { type: 'string' }
    }
  },

  RevokeSession: {
    type: 'object',
    required: ['session_id'],
    properties: {
      session_id: { type: 'string' }
    }
  },

  SessionResponse: {
    type: 'object',
    properties: {
      session_id: { type: 'string' },
      access_token: { type: 'string' },
      refresh_token: { type: 'string' },
      user_id: { type: 'string' },
      tenant_id: { type: 'string' },
      device: { $ref: '#/components/schemas/Device' },
      created_at: { type: 'string', format: 'date-time' },
      expires_at: { type: 'string', format: 'date-time' }
    }
  }
}
