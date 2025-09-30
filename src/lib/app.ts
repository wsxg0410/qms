import { z } from 'zod';

export const createApiResponse = (data: any = true, status: number = 200) => {
  return new Response(
    JSON.stringify({
      success: status >= 200 && status < 300,
      data: data,
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    },
  );
};

export const validate = (validator: z.ZodSchema, data: any) => {
  try {
    validator.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const newErrors: Record<string, string> = {};

      error.errors.forEach((err) => {
        newErrors[`${err.path.join(`.`)}`] = err.message;
      });

      return newErrors;
    }

    return null;
  }

  return null;
};
