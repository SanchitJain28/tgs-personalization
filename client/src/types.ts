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
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  samplePublicId?: string;
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
  label: "",
  xPercent: 30,
  yPercent: 20,
  widthPercent: 35,
};

export const DEFAULT_CONFIG: PersonalizationConfig = { fields: [] };
