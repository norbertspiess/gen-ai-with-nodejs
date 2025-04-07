import { OpenAI } from 'openai'
import { encoding_for_model } from 'tiktoken'

const openai = new OpenAI()

async function main(){
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        // 0 to 2 - less to more random
        temperature: undefined,
        // how much of token space to use (higher, bigger token pool is used)
        top_p: undefined,
        // limit answer to amount of tokens
        max_tokens: undefined,
        // how many choices in answer
        n: 1,
        // typical seeding, for determinism or not
        seed: undefined,
        messages:[{
            //  system - "configuring" role for behaviour
            //  user - actual user input
            //  assistant - responses from openai
            role: 'system',
            content: `You respond like a cool bro, and you respond in JSON format, like this:
                coolnessLevel: 1-10,
                answer: your answer
            `
        },{
            role: 'user',
            content: 'How tall is mount Everest?'
        }]
    })
    console.log(response.choices[0].message)
}

/**
 * tokenize a text
 */
function encodePrompt(){
    const prompt = "How are you today?"
    const encoder = encoding_for_model('gpt-4o-mini');
    const words = encoder.encode(prompt);
    console.log(words)
}

// encodePrompt();
// main()