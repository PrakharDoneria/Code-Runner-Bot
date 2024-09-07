import { Bot, InlineKeyboard } from "https://deno.land/x/grammy@v1.30.0/mod.ts";
const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
if (!botToken) {
  throw new Error("TELEGRAM_BOT_TOKEN is not set in the environment variables");
}
const bot = new Bot(botToken);
const url = "https://emkc.org/api/v2/piston/execute";
async function runCode(sourceCode, language, version) {
  const payload = {
    language,
    version,
    files: [
      {
        content: sourceCode
      }
    ],
    args: [],
    stdin: "",
    log: 0
  };
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (response.ok) {
    return await response.json();
  } else {
    return {
      error: `Request failed with status code ${response.status}`
    };
  }
}
async function handleCodeCommand(ctx, language, version) {
  const userId = ctx.message.from.id;
  let code = "";
  const onMessage = (message)=>{
    if (message === "") {
      return;
    }
    code += message + "\n";
  };
  bot.on("message:text", (messageCtx)=>{
    if (messageCtx.message.from.id === userId) {
      onMessage(messageCtx.message.text);
    }
  });
  await ctx.api.sendChatAction(userId, "typing");
  await ctx.api.sendMessage(userId, `Please send your ${language} code line by line. Send an empty message when you're done.`);
  setTimeout(async ()=>{
    const result = await runCode(code.trim(), language, version);
    const output = result.run?.output || `Error: ${result.error}`;
    await ctx.api.sendMessage(userId, output);
  }, 60000);
}
bot.command("start", async (ctx)=>{
  await ctx.api.sendMessage(ctx.message.from.id, "Welcome to the code execution bot! Use the following commands to run your code:\n\n" + "/python - Run Python code\n" + "/dart - Run Dart code\n" + "/javascript - Run JavaScript code\n" + "/csharp - Run C# code\n" + "/java - Run Java code\n" + "/kotlin - Run Kotlin code\n" + "/lua - Run Lua code\n" + "/php - Run PHP code\n" + "/perl - Run Perl code\n" + "/ruby - Run Ruby code\n" + "/rust - Run Rust code\n" + "/swift - Run Swift code\n" + "/sqlite3 - Run SQLite3 code\n" + "/languages - List available languages\n" + "/donate - Support the bot");
});
bot.command("help", async (ctx)=>{
  await ctx.api.sendMessage(ctx.message.from.id, "This bot allows you to execute code in various programming languages.\n\n" + "To use it, send a command followed by your code. For example:\n" + "/python\n<your code here>\n\n" + "Commands:\n" + "/start - Get a welcome message and list of commands\n" + "/help - Get help on how to use the bot\n" + "/languages - List available languages and their commands\n" + "/donate - Support the bot");
});
bot.command("languages", async (ctx)=>{
  await ctx.api.sendMessage(ctx.message.from.id, "Available languages:\n\n" + "Python - /python\n" + "Dart - /dart\n" + "JavaScript - /javascript\n" + "C# - /csharp\n" + "Java - /java\n" + "Kotlin - /kotlin\n" + "Lua - /lua\n" + "PHP - /php\n" + "Perl - /perl\n" + "Ruby - /ruby\n" + "Rust - /rust\n" + "Swift - /swift\n" + "SQLite3 - /sqlite3\n" + "/donate - Support the bot");
});
bot.command("donate", async (ctx)=>{
  const userId = ctx.message.from.id;
  const keyboard = new InlineKeyboard().add({
    text: "Donate via PayPal",
    url: "https://paypal.me/prakhardoneria"
  }, {
    text: "Buy Me a Coffee",
    url: "https://www.buymeacoffee.com/prakhardoneria.in"
  });
  await ctx.api.sendMessage(userId, "If you appreciate this bot and want to support its development, you can donate via the following options:", {
    reply_markup: keyboard
  });
});
bot.command("python", (ctx)=>handleCodeCommand(ctx, "python", "3.10.0"));
bot.command("dart", (ctx)=>handleCodeCommand(ctx, "dart", "2.19.6"));
bot.command("javascript", (ctx)=>handleCodeCommand(ctx, "javascript", "1.32.3"));
bot.command("csharp", (ctx)=>handleCodeCommand(ctx, "csharp", "6.12.0"));
bot.command("java", (ctx)=>handleCodeCommand(ctx, "java", "15.0.2"));
bot.command("kotlin", (ctx)=>handleCodeCommand(ctx, "kotlin", "1.8.20"));
bot.command("lua", (ctx)=>handleCodeCommand(ctx, "lua", "5.4.4"));
bot.command("php", (ctx)=>handleCodeCommand(ctx, "php", "8.2.3"));
bot.command("perl", (ctx)=>handleCodeCommand(ctx, "perl", "5.36.0"));
bot.command("ruby", (ctx)=>handleCodeCommand(ctx, "ruby", "3.0.1"));
bot.command("rust", (ctx)=>handleCodeCommand(ctx, "rust", "1.68.2"));
bot.command("swift", (ctx)=>handleCodeCommand(ctx, "swift", "5.3.3"));
bot.command("sqlite3", (ctx)=>handleCodeCommand(ctx, "sqlite3", "3.36.0"));
bot.start();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvQ29kZS1SdW5uZXItQm90L2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJvdCwgSW5saW5lS2V5Ym9hcmQgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQveC9ncmFtbXlAdjEuMzAuMC9tb2QudHNcIjtcblxuY29uc3QgYm90VG9rZW4gPSBEZW5vLmVudi5nZXQoXCJURUxFR1JBTV9CT1RfVE9LRU5cIik7XG5pZiAoIWJvdFRva2VuKSB7XG4gIHRocm93IG5ldyBFcnJvcihcIlRFTEVHUkFNX0JPVF9UT0tFTiBpcyBub3Qgc2V0IGluIHRoZSBlbnZpcm9ubWVudCB2YXJpYWJsZXNcIik7XG59XG5cbmNvbnN0IGJvdCA9IG5ldyBCb3QoYm90VG9rZW4pO1xuY29uc3QgdXJsID0gXCJodHRwczovL2Vta2Mub3JnL2FwaS92Mi9waXN0b24vZXhlY3V0ZVwiO1xuXG5hc3luYyBmdW5jdGlvbiBydW5Db2RlKHNvdXJjZUNvZGU6IHN0cmluZywgbGFuZ3VhZ2U6IHN0cmluZywgdmVyc2lvbjogc3RyaW5nKSB7XG4gIGNvbnN0IHBheWxvYWQgPSB7XG4gICAgbGFuZ3VhZ2UsXG4gICAgdmVyc2lvbixcbiAgICBmaWxlczogW3sgY29udGVudDogc291cmNlQ29kZSB9XSxcbiAgICBhcmdzOiBbXSxcbiAgICBzdGRpbjogXCJcIixcbiAgICBsb2c6IDAsXG4gIH07XG5cbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgIGhlYWRlcnM6IHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShwYXlsb2FkKSxcbiAgfSk7XG5cbiAgaWYgKHJlc3BvbnNlLm9rKSB7XG4gICAgcmV0dXJuIGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4geyBlcnJvcjogYFJlcXVlc3QgZmFpbGVkIHdpdGggc3RhdHVzIGNvZGUgJHtyZXNwb25zZS5zdGF0dXN9YCB9O1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZUNvZGVDb21tYW5kKGN0eDogYW55LCBsYW5ndWFnZTogc3RyaW5nLCB2ZXJzaW9uOiBzdHJpbmcpIHtcbiAgY29uc3QgdXNlcklkID0gY3R4Lm1lc3NhZ2UuZnJvbS5pZDtcbiAgbGV0IGNvZGUgPSBcIlwiO1xuXG4gIGNvbnN0IG9uTWVzc2FnZSA9IChtZXNzYWdlOiBzdHJpbmcpID0+IHtcbiAgICBpZiAobWVzc2FnZSA9PT0gXCJcIikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb2RlICs9IG1lc3NhZ2UgKyBcIlxcblwiO1xuICB9O1xuXG4gIGJvdC5vbihcIm1lc3NhZ2U6dGV4dFwiLCAobWVzc2FnZUN0eDogYW55KSA9PiB7XG4gICAgaWYgKG1lc3NhZ2VDdHgubWVzc2FnZS5mcm9tLmlkID09PSB1c2VySWQpIHtcbiAgICAgIG9uTWVzc2FnZShtZXNzYWdlQ3R4Lm1lc3NhZ2UudGV4dCk7XG4gICAgfVxuICB9KTtcblxuICBhd2FpdCBjdHguYXBpLnNlbmRDaGF0QWN0aW9uKHVzZXJJZCwgXCJ0eXBpbmdcIik7XG4gIGF3YWl0IGN0eC5hcGkuc2VuZE1lc3NhZ2UodXNlcklkLCBgUGxlYXNlIHNlbmQgeW91ciAke2xhbmd1YWdlfSBjb2RlIGxpbmUgYnkgbGluZS4gU2VuZCBhbiBlbXB0eSBtZXNzYWdlIHdoZW4geW91J3JlIGRvbmUuYCk7XG5cbiAgc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcnVuQ29kZShjb2RlLnRyaW0oKSwgbGFuZ3VhZ2UsIHZlcnNpb24pO1xuICAgIGNvbnN0IG91dHB1dCA9IHJlc3VsdC5ydW4/Lm91dHB1dCB8fCBgRXJyb3I6ICR7cmVzdWx0LmVycm9yfWA7XG4gICAgYXdhaXQgY3R4LmFwaS5zZW5kTWVzc2FnZSh1c2VySWQsIG91dHB1dCk7XG4gIH0sIDYwMDAwKTtcbn1cblxuYm90LmNvbW1hbmQoXCJzdGFydFwiLCBhc3luYyAoY3R4KSA9PiB7XG4gIGF3YWl0IGN0eC5hcGkuc2VuZE1lc3NhZ2UoY3R4Lm1lc3NhZ2UuZnJvbS5pZCwgXG4gICAgXCJXZWxjb21lIHRvIHRoZSBjb2RlIGV4ZWN1dGlvbiBib3QhIFVzZSB0aGUgZm9sbG93aW5nIGNvbW1hbmRzIHRvIHJ1biB5b3VyIGNvZGU6XFxuXFxuXCIgK1xuICAgIFwiL3B5dGhvbiAtIFJ1biBQeXRob24gY29kZVxcblwiICtcbiAgICBcIi9kYXJ0IC0gUnVuIERhcnQgY29kZVxcblwiICtcbiAgICBcIi9qYXZhc2NyaXB0IC0gUnVuIEphdmFTY3JpcHQgY29kZVxcblwiICtcbiAgICBcIi9jc2hhcnAgLSBSdW4gQyMgY29kZVxcblwiICtcbiAgICBcIi9qYXZhIC0gUnVuIEphdmEgY29kZVxcblwiICtcbiAgICBcIi9rb3RsaW4gLSBSdW4gS290bGluIGNvZGVcXG5cIiArXG4gICAgXCIvbHVhIC0gUnVuIEx1YSBjb2RlXFxuXCIgK1xuICAgIFwiL3BocCAtIFJ1biBQSFAgY29kZVxcblwiICtcbiAgICBcIi9wZXJsIC0gUnVuIFBlcmwgY29kZVxcblwiICtcbiAgICBcIi9ydWJ5IC0gUnVuIFJ1YnkgY29kZVxcblwiICtcbiAgICBcIi9ydXN0IC0gUnVuIFJ1c3QgY29kZVxcblwiICtcbiAgICBcIi9zd2lmdCAtIFJ1biBTd2lmdCBjb2RlXFxuXCIgK1xuICAgIFwiL3NxbGl0ZTMgLSBSdW4gU1FMaXRlMyBjb2RlXFxuXCIgK1xuICAgIFwiL2xhbmd1YWdlcyAtIExpc3QgYXZhaWxhYmxlIGxhbmd1YWdlc1xcblwiICtcbiAgICBcIi9kb25hdGUgLSBTdXBwb3J0IHRoZSBib3RcIlxuICApO1xufSk7XG5cbmJvdC5jb21tYW5kKFwiaGVscFwiLCBhc3luYyAoY3R4KSA9PiB7XG4gIGF3YWl0IGN0eC5hcGkuc2VuZE1lc3NhZ2UoY3R4Lm1lc3NhZ2UuZnJvbS5pZCwgXG4gICAgXCJUaGlzIGJvdCBhbGxvd3MgeW91IHRvIGV4ZWN1dGUgY29kZSBpbiB2YXJpb3VzIHByb2dyYW1taW5nIGxhbmd1YWdlcy5cXG5cXG5cIiArXG4gICAgXCJUbyB1c2UgaXQsIHNlbmQgYSBjb21tYW5kIGZvbGxvd2VkIGJ5IHlvdXIgY29kZS4gRm9yIGV4YW1wbGU6XFxuXCIgK1xuICAgIFwiL3B5dGhvblxcbjx5b3VyIGNvZGUgaGVyZT5cXG5cXG5cIiArXG4gICAgXCJDb21tYW5kczpcXG5cIiArXG4gICAgXCIvc3RhcnQgLSBHZXQgYSB3ZWxjb21lIG1lc3NhZ2UgYW5kIGxpc3Qgb2YgY29tbWFuZHNcXG5cIiArXG4gICAgXCIvaGVscCAtIEdldCBoZWxwIG9uIGhvdyB0byB1c2UgdGhlIGJvdFxcblwiICtcbiAgICBcIi9sYW5ndWFnZXMgLSBMaXN0IGF2YWlsYWJsZSBsYW5ndWFnZXMgYW5kIHRoZWlyIGNvbW1hbmRzXFxuXCIgK1xuICAgIFwiL2RvbmF0ZSAtIFN1cHBvcnQgdGhlIGJvdFwiXG4gICk7XG59KTtcblxuYm90LmNvbW1hbmQoXCJsYW5ndWFnZXNcIiwgYXN5bmMgKGN0eCkgPT4ge1xuICBhd2FpdCBjdHguYXBpLnNlbmRNZXNzYWdlKGN0eC5tZXNzYWdlLmZyb20uaWQsIFxuICAgIFwiQXZhaWxhYmxlIGxhbmd1YWdlczpcXG5cXG5cIiArXG4gICAgXCJQeXRob24gLSAvcHl0aG9uXFxuXCIgK1xuICAgIFwiRGFydCAtIC9kYXJ0XFxuXCIgK1xuICAgIFwiSmF2YVNjcmlwdCAtIC9qYXZhc2NyaXB0XFxuXCIgK1xuICAgIFwiQyMgLSAvY3NoYXJwXFxuXCIgK1xuICAgIFwiSmF2YSAtIC9qYXZhXFxuXCIgK1xuICAgIFwiS290bGluIC0gL2tvdGxpblxcblwiICtcbiAgICBcIkx1YSAtIC9sdWFcXG5cIiArXG4gICAgXCJQSFAgLSAvcGhwXFxuXCIgK1xuICAgIFwiUGVybCAtIC9wZXJsXFxuXCIgK1xuICAgIFwiUnVieSAtIC9ydWJ5XFxuXCIgK1xuICAgIFwiUnVzdCAtIC9ydXN0XFxuXCIgK1xuICAgIFwiU3dpZnQgLSAvc3dpZnRcXG5cIiArXG4gICAgXCJTUUxpdGUzIC0gL3NxbGl0ZTNcXG5cIiArXG4gICAgXCIvZG9uYXRlIC0gU3VwcG9ydCB0aGUgYm90XCJcbiAgKTtcbn0pO1xuXG5ib3QuY29tbWFuZChcImRvbmF0ZVwiLCBhc3luYyAoY3R4KSA9PiB7XG4gIGNvbnN0IHVzZXJJZCA9IGN0eC5tZXNzYWdlLmZyb20uaWQ7XG4gIGNvbnN0IGtleWJvYXJkID0gbmV3IElubGluZUtleWJvYXJkKClcbiAgICAuYWRkKFxuICAgICAgeyB0ZXh0OiBcIkRvbmF0ZSB2aWEgUGF5UGFsXCIsIHVybDogXCJodHRwczovL3BheXBhbC5tZS9wcmFraGFyZG9uZXJpYVwiIH0sXG4gICAgICB7IHRleHQ6IFwiQnV5IE1lIGEgQ29mZmVlXCIsIHVybDogXCJodHRwczovL3d3dy5idXltZWFjb2ZmZWUuY29tL3ByYWtoYXJkb25lcmlhLmluXCIgfVxuICAgICk7XG5cbiAgYXdhaXQgY3R4LmFwaS5zZW5kTWVzc2FnZSh1c2VySWQsIFxuICAgIFwiSWYgeW91IGFwcHJlY2lhdGUgdGhpcyBib3QgYW5kIHdhbnQgdG8gc3VwcG9ydCBpdHMgZGV2ZWxvcG1lbnQsIHlvdSBjYW4gZG9uYXRlIHZpYSB0aGUgZm9sbG93aW5nIG9wdGlvbnM6XCIsXG4gICAgeyByZXBseV9tYXJrdXA6IGtleWJvYXJkIH1cbiAgKTtcbn0pO1xuXG5ib3QuY29tbWFuZChcInB5dGhvblwiLCAoY3R4KSA9PiBoYW5kbGVDb2RlQ29tbWFuZChjdHgsIFwicHl0aG9uXCIsIFwiMy4xMC4wXCIpKTtcbmJvdC5jb21tYW5kKFwiZGFydFwiLCAoY3R4KSA9PiBoYW5kbGVDb2RlQ29tbWFuZChjdHgsIFwiZGFydFwiLCBcIjIuMTkuNlwiKSk7XG5ib3QuY29tbWFuZChcImphdmFzY3JpcHRcIiwgKGN0eCkgPT4gaGFuZGxlQ29kZUNvbW1hbmQoY3R4LCBcImphdmFzY3JpcHRcIiwgXCIxLjMyLjNcIikpO1xuYm90LmNvbW1hbmQoXCJjc2hhcnBcIiwgKGN0eCkgPT4gaGFuZGxlQ29kZUNvbW1hbmQoY3R4LCBcImNzaGFycFwiLCBcIjYuMTIuMFwiKSk7XG5ib3QuY29tbWFuZChcImphdmFcIiwgKGN0eCkgPT4gaGFuZGxlQ29kZUNvbW1hbmQoY3R4LCBcImphdmFcIiwgXCIxNS4wLjJcIikpO1xuYm90LmNvbW1hbmQoXCJrb3RsaW5cIiwgKGN0eCkgPT4gaGFuZGxlQ29kZUNvbW1hbmQoY3R4LCBcImtvdGxpblwiLCBcIjEuOC4yMFwiKSk7XG5ib3QuY29tbWFuZChcImx1YVwiLCAoY3R4KSA9PiBoYW5kbGVDb2RlQ29tbWFuZChjdHgsIFwibHVhXCIsIFwiNS40LjRcIikpO1xuYm90LmNvbW1hbmQoXCJwaHBcIiwgKGN0eCkgPT4gaGFuZGxlQ29kZUNvbW1hbmQoY3R4LCBcInBocFwiLCBcIjguMi4zXCIpKTtcbmJvdC5jb21tYW5kKFwicGVybFwiLCAoY3R4KSA9PiBoYW5kbGVDb2RlQ29tbWFuZChjdHgsIFwicGVybFwiLCBcIjUuMzYuMFwiKSk7XG5ib3QuY29tbWFuZChcInJ1YnlcIiwgKGN0eCkgPT4gaGFuZGxlQ29kZUNvbW1hbmQoY3R4LCBcInJ1YnlcIiwgXCIzLjAuMVwiKSk7XG5ib3QuY29tbWFuZChcInJ1c3RcIiwgKGN0eCkgPT4gaGFuZGxlQ29kZUNvbW1hbmQoY3R4LCBcInJ1c3RcIiwgXCIxLjY4LjJcIikpO1xuYm90LmNvbW1hbmQoXCJzd2lmdFwiLCAoY3R4KSA9PiBoYW5kbGVDb2RlQ29tbWFuZChjdHgsIFwic3dpZnRcIiwgXCI1LjMuM1wiKSk7XG5ib3QuY29tbWFuZChcInNxbGl0ZTNcIiwgKGN0eCkgPT4gaGFuZGxlQ29kZUNvbW1hbmQoY3R4LCBcInNxbGl0ZTNcIiwgXCIzLjM2LjBcIikpO1xuXG5ib3Quc3RhcnQoKTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLEdBQUcsRUFBRSxjQUFjLFFBQVEsNENBQTRDO0FBRWhGLE1BQU0sV0FBVyxLQUFLLEdBQUcs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