import React, { useRef } from "react";
import Card from "./Card";

function Foreground() {

  const ref = useRef(null)

  const data = [
    {
      Desc: "lorem, ipsum dolor sit amet consectetur adipisicing elit. At, fugiat?",
      filesize: "0.9mb",
      close: true,
      tag: { isOpen: true, tagTitle: "Download Now", tagColor: "blue" },
    },
    {
      Desc: "Adding in some english text as well coz why not!",
      filesize: "0.9mb",
      close: false,
      tag: { isOpen: false, tagTitle: "Download Now", tagColor: "green" },
    },
    {
      Desc: " Lorem, ipsum dolor sit amet consectetur adipisicing elit. At, fugiat?",
      filesize: "0.9mb",
      close: false,
      tag: { isOpen: true, tagTitle: "Download Now", tagColor: "green" },
    },
  ];
  return (
    <div ref={ref} className="fixed z-[3] h-full w-full top-0 left-0 flex flex-wrap gap-10 p-5">
      {data.map((item, index) => (
        <Card data={item} key={index} reference={ref} />
      ))}
    </div>
  );
}

export default Foreground;
