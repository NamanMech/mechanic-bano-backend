// api/tutorials/route.js
import dbConnect from '../../../config/dbConnect';
import Tutorial from '../../../models/Tutorial';

export const GET = async () => {
  await dbConnect();
  const tutorials = await Tutorial.find();
  return new Response(JSON.stringify(tutorials), { status: 200 });
};

export const POST = async (req) => {
  await dbConnect();
  const { title, description, youtubeLink } = await req.json();

  const tutorial = new Tutorial({ title, description, youtubeLink });
  await tutorial.save();

  return new Response(JSON.stringify({ message: 'Tutorial added successfully' }), { status: 201 });
};
