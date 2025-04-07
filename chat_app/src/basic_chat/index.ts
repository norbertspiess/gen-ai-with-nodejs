import OpenAI from 'openai';
import { encoding_for_model } from 'tiktoken';

const openai = new OpenAI();
const encoder = encoding_for_model('gpt-4o-mini');

const MAX_TOKENS = 700;

// collect all request and response messages for chat history
const context: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [{
    role: 'system',
    content: 'You are a helpful chatbot'
}]

async function createChatCompletion() {
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: context
    })
    const responseMessage = response.choices[0].message;
    // push response to context/history of chat to keep questions and answers
    context.push(responseMessage)

    if (response.usage && response.usage?.total_tokens > MAX_TOKENS) {
        deleteOlderMessages();
    }

    console.log(`${response.choices[0].message.role}: ${response.choices[0].message.content}`)
}

process.stdin.addListener('data', async function (input) {
    const userInput = input.toString().trim();
    context.push({
        role: 'user',
        content: userInput
    })
    await createChatCompletion();
})

// keep chat context small out of financial reasons and avoid Open AI thresholds/limits
// https://platform.openai.com/docs/models/gpt-4o-mini
function deleteOlderMessages(){
    let contextLength = getContextLength();
    while (contextLength > MAX_TOKENS) {
        for(let i= 0; i < context.length; i++) {
            const message = context[i];
            if (message.role != 'system') {
                context.splice(i, 1);
                contextLength = getContextLength();
                console.log('New context length: '+ contextLength);
                break;
            }
        }
    }
}

function getContextLength(){
    let length = 0;
    context.forEach((message) => {
        if (typeof message.content == 'string') {
            length += encoder.encode(message.content).length;
        } else if (Array.isArray(message.content)) {
            message.content.forEach((messageContent) => {
                if (messageContent.type == 'text') {
                    length += encoder.encode(messageContent.text).length;
                }
            })
        }
    })
    return length
}