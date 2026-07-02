import { useIsMobile } from "@ui";
import Button from "@ui/components/core/button/Button";
import { cn } from "@ui/util/classNameConstructor";

interface ToolbarProps {
  onRestart: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onFinish: () => void;
  onGallery: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  finishDisabled?: boolean;
  isOriginalImage?: boolean;
  generationsCount?: number;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onRestart,
  onUndo,
  onRedo,
  onFinish,
  onGallery,
  canUndo = true,
  canRedo = true,
  finishDisabled = false,
  isOriginalImage = false,
  generationsCount = 0,
}) => {
  const isMobile = useIsMobile();
  const buttonSize = isMobile ? "sm" : "lg";

  return (
    <div
      className={cn(
        "fixed top-2 right-2 z-[99999] flex items-center rounded-lg",
        isMobile ? "gap-1 p-1" : "gap-4 p-2",
      )}
    >
      {!isOriginalImage && (
        <Button
          variant="shapeless"
          size={buttonSize}
          onClick={onRestart}
          aria-label="Neustart"
          text={isMobile ? undefined : "Neustart"}
          leadingIcon="reload"
          classNameWrapper={isMobile ? undefined : "-mr-3"}
        />
      )}
      {generationsCount > 0 && (
        <Button
          variant="shapeless"
          size={buttonSize}
          onClick={onGallery}
          aria-label="Galerie"
          leadingIcon="image-gallery"
          text={isMobile ? undefined : "Galerie"}
        />
      )}

      <Button
        size={buttonSize}
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo"
        leadingIcon="undo"
        variant={cn(canUndo ? "outline" : "shapeless")}
        className={cn(canUndo ? "bg-white" : "")}
      />

      <Button
        size={buttonSize}
        leadingIcon="redo"
        onClick={onRedo}
        disabled={!canRedo}
        aria-label="Redo"
        variant={cn(canRedo ? "outline" : "shapeless")}
        className={cn(isMobile ? "" : "-ml-2", canRedo ? "bg-white" : "")}
      />

      <Button
        text={isMobile ? undefined : "Fertig"}
        aria-label="Fertig"
        variant="outline"
        className="bg-white"
        size={buttonSize}
        trailingIcon="checkmark-lg"
        disabled={finishDisabled}
        onClick={onFinish}
      />
    </div>
  );
};

export default Toolbar;
