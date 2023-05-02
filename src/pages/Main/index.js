import React, { useState, useRef, useEffect, useMemo } from 'react';

import { PDFDocument } from 'pdf-lib';
import SignaturePad from 'react-signature-pad-wrapper';
import {
  FaPencilAlt,
  FaEraser,
  FaFileSignature,
} from 'react-icons/fa';
import interact from "interactjs";
import { SignContainer, PdfContainer, SignButton } from './styles';
import Container from '../../components/Container';
import { useOnClickOutside } from "./useOnClickOutside";
import { dragMoveListener, resizeListener } from "./listeners";


export default function Main() {

  const [signing, SetSigning] = useState(false);
  const [pdf, SetPdf] = useState(null);
  const [signature, SetSignature] = useState("");
  const [signatureFocused, setSignatureFocus] = useState(true);
  const isSignatureVisible = useMemo(() => signature !== "", [signature]);
  const [pdfHeight, SetPdfHeight] = useState("300px");

  const [pdfObjectRightX, setPdfObjectRightX] = useState(0);
  const [pdfObjectRightY, setPdfObjectRightY] = useState(0);
  const [signButtonShow, SetSignButtonShow] = useState("none");
  const [pdfObjectPosition, setPdfObjectPosition] = useState({ x: 0, y: 0 });
  // Ref
  // const signaturePad = useRef< SignaturePad >(null);
  // const signatureRef = useRef< HTMLDivElement >(null);

  const signaturePad = useRef(SignaturePad);
  const signatureRef = useRef(HTMLDivElement);

  useOnClickOutside(signatureRef, () => setSignatureFocus(false));

  const [signatureSize, setSignatureSize] = useState({
    width: 60,
    height: 60,
  });
  const [signaturePoint, setSignaturePoint] = useState({
    x: 0,
    y: 0,
  });

  function clear() {
    signaturePad.current?.clear();
    SetSignature("");
  };

  async function saveSign(pageNumber) {
    const trimmedDataURL = signaturePad.current.toDataURL("image/png")

    if (pdf) {
      console.log("if pdf");
      const pdfDoc = await PDFDocument.load(pdf);

      const pngImage = await pdfDoc.embedPng(trimmedDataURL);
      const page = pdfDoc.getPages()[pageNumber - 1];

      console.log(`signatureSizeYYY: " + ${signatureSize.height}`);

      page.drawImage(pngImage, {
        x: signaturePoint.x + 195, // because first we set the pdf object positionx --+200
        y: page.getHeight() - signaturePoint.y - 105 - (signatureSize.height - 60),// because first we set pdf ojbect positiony 100
        width: signatureSize.width,
        height: signatureSize.height,
      });


      const pdfBytes = await pdfDoc.saveAsBase64({ dataUri: true });
      SetSignature("");// ??
      SetPdf(pdfBytes);
      SetSigning(true);
    }
  }

  const trim = async () => {

    SetSigning(false);

    const trimmedDataURL = signaturePad.current.toDataURL("image/png")
    SetSignature(trimmedDataURL);// ??
    SetSigning(true);

  };

  const handleChange = e => {
    const reader = new FileReader();
    const file = e.target.files[0];
    reader.onloadend = async () => {
      SetPdf(reader.result);
      const pdfDoc = await PDFDocument.load(reader.result);
      const firstPage = pdfDoc.getPages()[0];
      SetPdfHeight(`${firstPage.getHeight()} + "px"`);
      // try
      const pdfObjectElement = document.querySelector('object[title="pdfobject"]');
      if (pdfObjectElement) {
        // Get the position of the element
        const rect = pdfObjectElement.getBoundingClientRect();
        setPdfObjectPosition({ x: rect.x + 200, y: rect.y + 100 });
        // For Sign Button Position---
        setPdfObjectRightX(rect.x + firstPage.getWidth() - 140);
        setPdfObjectRightY(rect.y + 10);
        SetSignButtonShow("block"); // sign button display=block
      }
    };

    reader.readAsDataURL(file);
  };


  useEffect(() => {
    console.log("useEffect");
    if (signatureRef.current === null) {
      console.log("signatureRef.current === null");
      return;
    }
    interact(signatureRef.current)
      .resizable({
        edges: { top: true, right: true, bottom: true, left: true },
        listeners: {
          move: (event) => {
            const { width, height } = event.rect;
            setSignatureSize({ width, height });
            resizeListener(event);
          },
        },
        modifiers: [
          interact.modifiers.restrictEdges({ outer: "parent" }),
          interact.modifiers.restrictSize({
            min: { width: 30, height: 30 },
          }),
        ],
      })
      .draggable({
        listeners: {
          move: (event) => {
            const { x, y } = dragMoveListener(event);
            setSignaturePoint({ x, y });
            // console.log("x: " + x + " y: " + y);
          },
        },
        inertia: false,
        modifiers: [
          interact.modifiers.restrictRect({
            restriction: "parent",
            endOnly: true,
          }),
        ],
        allowFrom: "#signature", // Add this line
      });
  }, [signature]);

  return (
    <div>
      <Container>
        <h1>
          <FaFileSignature />
          PDF Fill & Sign
          <input type="file" onChange={handleChange} />
          {/* <button onClick={() => saveSign(1)} style={{ marginLeft: "10px" }}>Save Signature</button> */}
        </h1>


        <PdfContainer>

          <div role="button" tabIndex={0}
            id="signature"
            className={`z-20 box-content absolute ${signatureFocused
              ? "outline-2 outline-dashed outline-red-500"
              : ""
              }  ${isSignatureVisible
                ? "visible pointer-events-auto opacity-100"
                : "invisible pointer-events-none opacity-0"
              }`}
            style={{ position: "absolute", left: `${pdfObjectPosition.x}px`, top: `${pdfObjectPosition.y}px`, outline: `${isSignatureVisible ? "dashed" : ""}`, width: `${signatureSize.width}px`, height: `${signatureSize.width}px` }}
            ref={signatureRef}
            onClick={(e) => {
              console.log("sign click");
              e.stopPropagation();
              setSignatureFocus(true);
            }}
            onKeyDown={(e) => { if (e.key === "Enter") { console.log("sign enter press"); setSignatureFocus(true); } }}
          >
            <img
              className="object-contain"
              src={signature}
              alt="pdfobject-alt"
              width="100%"
              height="100%"
              style={{ display: `${signature ? "block" : "none"}` }}
            />
          </div>
          <button type="button" onClick={() => saveSign(1)} style={{
            position: "absolute",
            left: `${pdfObjectRightX}px`,
            top: `${pdfObjectRightY}px`,
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            padding: "5px",
            boxShadow: "0px 0px 5px 0px rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: `${signButtonShow}`
          }}>
            Sign
          </button>
          <object title="pdfobject" id="pdfobject" data={pdf} type="application/pdf" width="100%" height={pdfHeight} />

        </PdfContainer>

        <SignContainer>
          <SignaturePad
            ref={signaturePad}
            options={{
              minWidth: 4,
              maxWidth: 16,
              dotSize: 2,
              penColor: "rgb(15 23 42)",
            }}
          />
          <div>
            <button type="button" onClick={clear} >
              <FaEraser color="#fff" size={14} />
            </button>
            <SignButton onClick={trim} >
              {signing ? (
                <FaPencilAlt color="#fff" size={14} />
              ) : (
                <FaPencilAlt color="#fff" size={14} />
              )}
            </SignButton>
          </div>
        </SignContainer>
      </Container >
    </div>

  );
}
