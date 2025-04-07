import OpenAI from "openai";

const openAI = new OpenAI();

function getTimeOfDay(){
    const now = new Date();
    return `${now.getHours()}:${now.getMinutes()}`;
}

function getOrderStatus(orderId: string){
    console.log(`Getting the status of order ${orderId}`)
    const orderAsNumber = parseInt(orderId);
    if (orderAsNumber % 2 == 0) {
        return 'IN_PROGRESS'
    }
    return 'COMPLETED'
}

async function callOpenAIWithTools() {
    const context: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
            role: 'system',
            content: 'You are a helpful assistant that gives information about the time of day and order status'
        },
        {
            role: 'user',
            content: 'What is the time?'
        },
        {
            role: 'user',
            content: 'What is the status of order 1234?'
        }
    ]

    // configure chat tools (first openAI call)
    const response = await openAI.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: context,
        tools: [
            {
                type: 'function',
                function: {
                    name: 'getTimeOfDay',
                    description: 'Get the time of day'
                }
            },
            {
                type: 'function',
                function: {
                    name: 'getOrderStatus',
                    description: 'Returns the status of an order',
                    parameters: {
                        type: 'object',
                        properties: {
                            orderId: {
                                type: 'string',
                                description: 'The id of the order to get the status of'
                            }
                        },
                        required: ['orderId']
                    }
                }
            }
        ],
        tool_choice: 'auto'// the engine will decide which tool to use
    });
    // decide if tool call is required  
    const willInvokeFunction = response.choices[0].finish_reason === 'tool_calls'

    if (willInvokeFunction) {
        // push assistant response into the context, required by API
        context.push(response.choices[0].message);

        response.choices[0].message.tool_calls!.forEach(toolCall => {
            const toolName = toolCall.function.name

            if (toolName == 'getTimeOfDay') {
                context.push({
                    role: 'tool',
                    content: getTimeOfDay(),
                    tool_call_id: toolCall.id
                })
            }

            if (toolName == 'getOrderStatus') {
                // get registered arguments from the identified tool call
                const rawArgument = toolCall.function.arguments;
                const parsedArguments = JSON.parse(rawArgument);
                context.push({
                    role: 'tool',
                    content: getOrderStatus(parsedArguments.orderId),
                    tool_call_id: toolCall.id
                })
            }
        })
    }

    const secondResponse = await openAI.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: context
    })
    const choice = secondResponse.choices[0];
    console.log(choice.message.content)

}

callOpenAIWithTools();


// 1. configure the tools (first OpenAI call)
// 2. decide if tool call is required
// 3. invoke the tool
// 4. make a second openAI call with the tool responses