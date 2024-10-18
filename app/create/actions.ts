"use server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import openai from "openai";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { zodResponseFormat } from "openai/helpers/zod";

const openaiClient = new openai({
  apiKey: process.env.OPENAI_API_KEY,
});

const lessonPlanSchema = z.object({
  topic: z.string(),
  subtopic: z.string(),
  duration: z.string(),
  studentLevel: z.string(),
  objective: z.string(),
  sections: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
      duration: z.string(),
    })
  ),
});

export async function CreateLessonPlan(formData: FormData) {
  const topic = formData.get("topic");
  const subtopic = formData.get("subtopic");
  const duration = formData.get("duration");
  const studentLevel = formData.get("studentLevel");
  const objective = formData.get("objective");

  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) {
      throw new Error("Unauthorized");
    }

    const userDB = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });

    if (!userDB) {
      throw new Error("User not found.");
    }

    const response = await openaiClient.beta.chat.completions.parse({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that generates lesson plans for teachers.",
        },
        {
          role: "user",
          content: `Generate a lesson plan for ${topic} with the subtopic of ${subtopic} with a duration of ${duration} minutes for ${studentLevel} students wuth the objective of ${objective}. The sections of the lesson plan should have a duration but the sum of all section durations should not exceed ${duration} minutes.`,
        },
      ],
      response_format: zodResponseFormat(lessonPlanSchema, "lessonPlan"),
    });

    const lessonPlan = response.choices[0].message.parsed;

    if (!lessonPlan) {
      throw new Error("No lesson plan generated.");
    }

    const lessonPlanDB = await prisma.lessonPlan.create({
      data: {
        ...lessonPlan,
        userId: userDB.id,
        title: lessonPlan.topic,
        subject: lessonPlan.subtopic,
        duration: parseInt(lessonPlan.duration, 10),
        sections: {
          create: lessonPlan.sections.map((section) => ({
            ...section,
            duration: parseInt(section.duration, 10),
          })),
        },
      },
    });

    revalidatePath("/dashboard")

    return { success: true}

  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "An error occurred while creating the lesson plan.",
    };
  }
}




// "use server";
// import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
// import prisma from "@/lib/prisma";
// import { z } from "zod";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { revalidatePath } from "next/cache";
// import { User } from "@prisma/client";
// import { KindeClient } from "@kinde-oss/kinde-auth-nextjs/types";

// // Initialize the Google Generative AI model
// const apiKey = process.env.GEMINI_API_KEY;
// const genAI = new GoogleGenerativeAI(apiKey as string);
// const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

// const generationConfig = {
//   temperature: 0.7,
//   topP: 1,
//   topK: 1,
//   maxOutputTokens: 2048,
// };
// const lessonPlanSchema = z.object({
//   topic: z.string(),
//   subtopic: z.string(),
//   duration: z.string(),
//   studentLevel: z.string(),
//   objective: z.string(),
//   sections: z.array(
//     z.object({
//       title: z.string(),
//       content: z.string(),
//       duration: z.string(),
//     })
//   ),
// });

// export async function CreateLessonPlan(formData: FormData) {
//   const topic = formData.get("topic");
//   const subtopic = formData.get("subtopic");
//   const duration = formData.get("duration");
//   const studentLevel = formData.get("studentLevel");
//   const objective = formData.get("objective");

//   try {
//     const { getUser } = getKindeServerSession();
//     const user = await getUser();

//     if (!user || !user.id) {
//       throw new Error("Unauthorized");
//     }

//     const userDB = await prisma.user.findUnique({
//       where: {
//         id: user.id,
//       },
//     });

//     if (!userDB) {
//       throw new Error("User not found.");
//     }
//     // console.log("User ID:", user);
//     const chatSession = model.startChat({
//       generationConfig,
//       history: [
//         {
//           role: "user",
//           parts: [{ text: "Hi, you are an AI assistant that generates lesson plans for teachers." }],
//         },
//         {
//           role: "model",
//           parts: [{ text: "Yes, I am a helpful assistant that generates lesson plans for teachers." }],
//         },
//         {
//           role: "user",
//           parts: [
//             {
//               text: `Generate a lesson plan for ${topic} with the subtopic of ${subtopic} with a duration of ${duration} minutes for ${studentLevel} students with the objective of ${objective}. The sections of the lesson plan should have a duration, but the sum of all section durations should not exceed ${duration} minutes.`,
//             },
//           ],
//         },
//       ],
//     });

//     const response = await chatSession.sendMessage("Generate the lesson plan");
//     const responseText = response.response.text();

//     // console.log("Raw response:", responseText); // Log the raw response for debugging

//     // Check if the response is in Markdown format
//     // if (responseText.startsWith("**")) {
//       const lessonPlan = parseMarkdownToLessonPlan(responseText);

//       // Validate response with Zod schema
//       lessonPlanSchema.parse(lessonPlan);
//       // console.log("Parsed lesson plan:", lessonPlanSchema);
//       // Create lesson plan in the database
//       if (!lessonPlan) {
//         throw new Error("No lesson plan generated.");
//       }
  
//       const lessonPlanDB = await prisma.lessonPlan.create({
//         data: {
//           ...lessonPlan,
//           userId: userDB.id,
//           u
//           title: lessonPlan.topic,
//           subject: lessonPlan.subtopic,
//           duration: parseInt(lessonPlan.duration, 10),
//           sections: {
//             create: lessonPlan.sections.map((section) => ({
//               ...section,
//               duration: parseInt(section.duration, 10),
//             })),
//           },
//         },
//       });
  
//       revalidatePath("/dashboard")
  
//       return { success: true}
  
//     } catch (error) {
//       console.error(error);
//       return {
//         success: false,
//         error: "An error occurred while creating the lesson plan.",
//       };
//     }
//   }
  

// // Define the structure for a lesson plan section
// interface LessonPlanSection {
//   title: string;
//   content: string;
//   duration: string;
// }

// // Function to parse Markdown response into a lesson plan object
// function parseMarkdownToLessonPlan(markdown: string) {
//   const lines = markdown.split("\n").filter(line => line.trim() !== "");
//   const lessonPlan = {
//     topic: lines[1].replace("**Subject:** ", "").trim(),
//     subtopic: lines[2].replace("**Subtopic:** ", "").trim(),
//     duration: lines[3].replace("**Duration:** ", "").trim(),
//     studentLevel: "Intermediate", // Assuming a default; modify as needed
//     objective: lines[5].replace("**Objective:**", "").trim(),
//     sections: [] as LessonPlanSection[], // Use the defined interface
//   };

//   let currentSection: LessonPlanSection | null = null; // Initialize with proper type
  
//   lines.forEach(line => {
//     if (line.startsWith("**")) {
//       if (currentSection) {
//         lessonPlan.sections.push(currentSection);
//       }
//       currentSection = {
//         title: line.replace("**", "").replace("**", "").trim(),
//         content: "",
//         duration: "10", // Default duration for each section
//       };
//     } else if (currentSection) {
//       currentSection.content += line + "\n"; // Append content
//     }
//   });
  
//   if (currentSection) {
//     lessonPlan.sections.push(currentSection); // Push the last section if it exists
//   }

//   return lessonPlan;
// }

