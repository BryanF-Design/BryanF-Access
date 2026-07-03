"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const LampContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col items-center justify-center overflow-hidden w-full z-0",
        className
      )}
      style={{ background: "#030f06" }}
    >
      <div className="relative flex w-full flex-1 scale-y-125 items-center justify-center isolate z-0 -translate-y-24 md:translate-y-0">
        {/* Left cone */}
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-auto right-1/2 h-56 overflow-visible w-[30rem]"
          style={{
            backgroundImage:
              "conic-gradient(from 70deg at center top, #99D742, transparent, transparent)",
          }}
        >
          <div
            className="absolute w-full left-0 h-40 bottom-0 z-20"
            style={{
              background: "#030f06",
              maskImage: "linear-gradient(to top, white, transparent)",
            }}
          />
          <div
            className="absolute w-40 h-full left-0 bottom-0 z-20"
            style={{
              background: "#030f06",
              maskImage: "linear-gradient(to right, white, transparent)",
            }}
          />
        </motion.div>

        {/* Right cone */}
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-auto left-1/2 h-56 w-[30rem]"
          style={{
            backgroundImage:
              "conic-gradient(from 290deg at center top, transparent, transparent, #99D742)",
          }}
        >
          <div
            className="absolute w-40 h-full right-0 bottom-0 z-20"
            style={{
              background: "#030f06",
              maskImage: "linear-gradient(to left, white, transparent)",
            }}
          />
          <div
            className="absolute w-full right-0 h-40 bottom-0 z-20"
            style={{
              background: "#030f06",
              maskImage: "linear-gradient(to top, white, transparent)",
            }}
          />
        </motion.div>

        <div
          className="absolute top-1/2 h-48 w-full translate-y-12 scale-x-150 blur-2xl"
          style={{ background: "#030f06" }}
        />
        <div className="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md" />
        <div
          className="absolute inset-auto z-50 h-36 w-[28rem] -translate-y-1/2 rounded-full opacity-40 blur-3xl"
          style={{ background: "#99D742" }}
        />

        <motion.div
          initial={{ width: "8rem" }}
          whileInView={{ width: "16rem" }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-auto z-30 h-36 -translate-y-[6rem] rounded-full blur-2xl"
          style={{ background: "#99D742" }}
        />
        <motion.div
          initial={{ width: "15rem" }}
          whileInView={{ width: "30rem" }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-auto z-50 h-0.5 w-[30rem] -translate-y-[7rem]"
          style={{ background: "#99D742" }}
        />

        <div
          className="absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem]"
          style={{ background: "#030f06" }}
        />
      </div>

      <div className="relative z-50 flex -translate-y-80 flex-col items-center px-5 w-full">
        {children}
      </div>
    </div>
  );
};
