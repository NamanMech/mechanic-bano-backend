// api/blobUpload.js
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST method allowed' });
  }

  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('multipart/form-data')) {
    return res.status(400).json({ message: 'Invalid content type' });
  }

  const busboy = await import('busboy');
  const bb = busboy.default({ headers: req.headers });

  let fileBuffer = Buffer.alloc(0);
  let fileName = '';

  bb.on('file', (fieldname, file, info) => {
    const { filename } = info;
    fileName = `${nanoid()}-${filename}`;
    file.on('data', (data) => {
      fileBuffer = Buffer.concat([fileBuffer, data]);
    });
  });

  bb.on('finish', async () => {
    try {
      const blob = await put(`pdfs/${fileName}`, fileBuffer, {
        access: 'public',
      });

      return res.status(200).json({ url: blob.url });
    } catch (err) {
      console.error('Blob upload failed:', err);
      return res.status(500).json({ message: 'Upload failed', error: err.message });
    }
  });

  req.pipe(bb);
}
