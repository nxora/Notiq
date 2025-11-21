import React, { useEffect, useState, useRef } from "react";
import Illustration1 from './../assets/Illustration1.png'
import Illustration2 from './../assets/Illustration2.png'
import Illustration3 from './../assets/Illustration3.png'
import Illustration4 from './../assets/Illustration4.png'

function IllustrationSlide() {
  const slides = [
    {
      url: Illustration1,
      caption: "Organize everything in one place — notes, tasks, docs.",
    },
    {
      url: Illustration2,
      caption: "Work faster with AI-powered writing and planning tools.",
    },
    {
      url: Illustration3,
      caption: "Collaborate with teams effortlessly in real time.",
    },
    {
      url: Illustration4,
      caption: "Turn chaos into clarity with structured knowledge.",
    },
  ];

  const INTERVAL = 5000; // 15 seconds
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressRef = useRef(null);

  // SLIDE SWITCHING
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, INTERVAL);

    return () => clearInterval(interval);
  }, [isPaused]);

  // PROGRESS BAR ANIMATION
  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.transition = "none";
      progressRef.current.style.width = "0%";

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          progressRef.current.style.transition = `width ${INTERVAL}ms linear`;
          progressRef.current.style.width = "100%";
        });
      });
    }
  }, [index]);

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`
            absolute inset-0 flex flex-col items-center justify-center
            transition-opacity duration-[2000ms] ease-out
            ${i === index ? "opacity-100" : "opacity-0"}
          `}
        >
          <img
            src={slide.url}
            alt="illustration"
            className="max-w-md drop-shadow-xl opacity-90"
          />
          <p className="mt-6 text-gray-600 text-lg font-medium text-center px-6">
            {slide.caption}
          </p>
        </div>
      ))}

      {/* Progress bar container */}
      <div className="absolute bottom-6 w-2/3 flex gap-2">
        {slides.map((_, i) => (
          <div key={i} className="h-1 w-full bg-gray-300 rounded-full overflow-hidden">
            {i === index && (
              <div
                ref={progressRef}
                className="h-full bg-black"
                style={{ width: "0%" }}
              ></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default IllustrationSlide;
