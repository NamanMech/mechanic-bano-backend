import dbConnect from '../../../config/dbConnect';
import Config from '../../../models/Config';

// Handle CORS Preflight
export const OPTIONS = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};

export const PUT = async (req) => {
  try {
    await dbConnect();
    const { websiteName } = await req.json();

    let config = await Config.findOne();
    if (config) {
      config.websiteName = websiteName;
      await config.save();
    } else {
      config = new Config({ websiteName, logoURL: '' });
      await config.save();
    }

    return new Response(JSON.stringify({ message: 'Site name updated successfully' }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Update Site Name Error:', error);
    return new Response(JSON.stringify({ message: 'Failed to update site name' }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};
