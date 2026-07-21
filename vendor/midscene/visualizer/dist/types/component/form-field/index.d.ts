import type { z } from '@midscene/core';
import type React from 'react';
interface FormFieldProps {
    name: string;
    label: string;
    fieldSchema: z.ZodTypeAny;
    isRequired: boolean;
    isLocateField: boolean;
    marginBottom: number;
    placeholder?: string;
}
export declare const TextField: React.FC<Omit<FormFieldProps, 'isLocateField'>>;
export declare const LocateField: React.FC<Omit<FormFieldProps, 'isLocateField'>>;
export declare const EnumField: React.FC<Omit<FormFieldProps, 'isLocateField'>>;
export declare const NumberField: React.FC<Omit<FormFieldProps, 'isLocateField'>>;
export declare const BooleanField: React.FC<Omit<FormFieldProps, 'isLocateField'>>;
export {};
