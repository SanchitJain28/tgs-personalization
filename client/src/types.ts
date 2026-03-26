export interface TextField {
  type: "text";
  label: string;
  maxChars: number;
  placeholder: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  textAlign: string;
  letterSpacing: number;
  lineSpacing: number;
  xPercent: number;
  yPercent: number;
}

export interface ImageField {
  type: "image";
  label: string;
  // REMOVED: xPercent, yPercent, widthPercent, aspectRatio
  // NEW properties for the interactive area:
  areaX: number; // % from left
  areaY: number; // % from top
  areaWidth: number; // % width
  areaHeight: number; // % height

  samplePublicId?: string;
  maskPublicId?: string;
  rotationAngle: number;
  borderRadius?: string;
  cropCoordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export type Field = TextField | ImageField;

export interface PersonalizationConfig {
  fields: Field[];
}

export interface ProductDetails {
  id: string;
  title: string;
  image: string | null;
  previewImage: string | null;
  isPersonalizable: boolean;
  config: PersonalizationConfig | null;
}

export const DEFAULT_TEXT_FIELD: TextField = {
  type: "text",
  label: "",
  maxChars: 30,
  placeholder: "",
  textColor: "C49A3C",
  fontSize: 60,
  fontFamily: "Arial",
  fontWeight: "bold",
  fontStyle: "normal",
  textDecoration: "none",
  textAlign: "center",
  letterSpacing: 0,
  lineSpacing: 0,
  xPercent: 50,
  yPercent: 80,
};

export const DEFAULT_IMAGE_FIELD: ImageField = {
  type: "image",
  label: "User Photo",
  areaX: 10,
  areaY: 15,
  areaWidth: 80,
  areaHeight: 70,
  samplePublicId: undefined,
  maskPublicId: undefined,
  rotationAngle: 0,
  borderRadius: "none",
  cropCoordinates: undefined,
};

export const DEFAULT_CONFIG: PersonalizationConfig = { fields: [] };
