import React from "react";

export function Loading() {
    return (
        <div className="mt-12 flex justify-center">
            <div className="w-12 h-12 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
        </div>
    );
}

export default Loading; 