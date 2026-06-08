// MongoDB init – Report/Media Service
db = db.getSiblingDB('workforce-media');

db.createCollection('media_reports', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['employee_id', 'filename', 'content_type', 'uploaded_at'],
      properties: {
        employee_id:   { bsonType: 'long',   description: 'FK to MySQL users.id' },
        order_id:      { bsonType: 'long',   description: 'FK to MySQL orders.id' },
        rapport_id:    { bsonType: 'string' },
        filename:      { bsonType: 'string' },
        content_type:  { bsonType: 'string' },
        file_size:     { bsonType: ['int', 'long'] },
        storage_path:  { bsonType: 'string' },
        uploaded_at:   { bsonType: 'date' },
        metadata:      { bsonType: 'object' },
        data:          { bsonType: 'binData' }
      }
    }
  }
});

db.media_reports.createIndex({ employee_id: 1 });
db.media_reports.createIndex({ order_id: 1 });
db.media_reports.createIndex({ uploaded_at: -1 });
