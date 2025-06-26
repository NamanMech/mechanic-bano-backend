// api/tutorials/[id]/route.js
import dbConnect from '../../../config/dbConnect';
import Tutorial from '../../../../models/Tutorial';

export const DELETE = async (req, { params }) => {
  await dbConnect();
  const { id } = params;

  await Tutorial.findByIdAndDelete(id);
  return new Response(JSON.stringify({ message: 'Tutorial deleted successfully' }), { status: 200 });
};
