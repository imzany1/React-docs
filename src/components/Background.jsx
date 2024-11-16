import React from "react";
import styles  from "./H1.module.css";

function Background() {
  return (
    <>
      <div className="fixed w-full h-screen z-[2]">
        <div className="absolute top-[5%]  w-full py-10 text-xl  text-zinc-50 flex justify-center font-semibold">
          Documents
        </div>
        <h1 className="absolute top-[50%] text-transparent bg-clip-text bg-gradient-to-r from-red-700 to-purple-700  left-[50%] translate-x-[-50%] translate-y-[-50%] text-[13vw] tracking-tighter font-semibold">
          Docs.
        </h1>
      </div>
    </>
  );
}

export default Background;
