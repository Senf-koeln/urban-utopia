import React from "react";
import { Button, useIsMobile } from "@ui";

const Header = ({
  handleBack,
  handleContinue,
  continueLoading,
  title,
}: {
  handleBack: () => void;
  handleContinue?: () => void;
  continueLoading?: boolean;
  title: string;
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex items-center justify-between p-3 px-4 border-b border-gray-200 h-[60px] md:p-6 md:px-8 md:h-[76px]">
      <Button
        onClick={handleBack}
        variant="outline"
        leadingIcon="arrow-left-md"
        text={isMobile ? undefined : "Zurück"}
        aria-label="Zurück"
        size={isMobile ? "sm" : "md"}
        classNameWrapper="absolute left-3 md:left-5"
      />
      <div className="flex-1 flex items-center justify-center gap-3 px-16 md:px-0">
        <h1 className="text-base font-bold text-gray-900 text-center truncate md:text-3xl">
          {title}
        </h1>
      </div>

      {handleContinue ? (
        <Button
          onClick={handleContinue}
          variant="primary"
          text={isMobile ? undefined : "Los geht's!"}
          aria-label="Los geht's!"
          trailingIcon={isMobile ? "arrow-right-md" : undefined}
          size={isMobile ? "sm" : "lg"}
          classNameWrapper="right-3 absolute md:right-5"
          loading={continueLoading}
          disabled={continueLoading}
        />
      ) : (
        <div />
      )}
    </div>
  );
};

export default Header;
