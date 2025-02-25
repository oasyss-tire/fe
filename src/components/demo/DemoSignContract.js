import React, { useRef, useState } from "react";

const DemoSignContract = ({ contract }) => {
  const canvasRef = useRef(null);
  const [signed, setSigned] = useState(false);

  const handleSign = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillText("서명완료", 50, 50);
    setSigned(true);
  };

  return (
    <div>
      <h2>{contract.name} - 서명</h2>
      <canvas ref={canvasRef} width={400} height={200} style={{ border: "1px solid black" }}></canvas>
      <button onClick={handleSign}>서명하기</button>
      {signed && <p>서명 완료!</p>}
    </div>
  );
};

export default DemoSignContract;
