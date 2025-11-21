import React from 'react';

function OrDivider() {
  return (
    <div className="flex items-center my-6">
      <div className=" border-t border-gray-300 w-24"></div>
      <span className="mx-4 text-sm text-gray-500">or continue with</span>
      <div className="flex-grow border-t border-gray-300  w-24"></div>
    </div>
  );
}

export default OrDivider;