import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

// flag used by findMe/help to bypass the day-2 spawn suppressor
let summoningKnocker = false;

// Eagerly register the "bond" scoreboard objective one tick after script load.
// Without this, /scoreboard players set @p bond <N> fails if no bond interaction
// has happened yet (the objective wouldn't exist for the command to target).
system.run(() => {
    try {
        if (!world.scoreboard.getObjective("bond")) {
            world.scoreboard.addObjective("bond", "bond");
        }
    } catch {}
});

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getBond(player) {
    try {
        const obj = world.scoreboard.getObjective("bond");
        if (!obj) return 0;
        const score = obj.getScore(player);
        return (score !== undefined && score !== null) ? score : 0;
    } catch { return 0; }
}

function addBond(player, amount) {
    try {
        let obj = world.scoreboard.getObjective("bond");
        if (!obj) obj = world.scoreboard.addObjective("bond", "bond");
        let current = 0;
        try { current = obj.getScore(player) ?? 0; } catch {}
        obj.setScore(player, Math.min(500, current + amount));
    } catch {}
}

function getTier(bond) {
    if (bond >= 400) return 3;
    if (bond >= 250) return 2;
    if (bond >= 100) return 1;
    return 0;
}

function bondColor(tier) {
    return ["§7", "§6", "§d", "§4"][tier];
}

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function say(player, message, tier, delayTicks) {
    const color = bondColor(tier);
    const line = message.replace(/{name}/g, player.name);
    const send = () => {
        try { world.sendMessage(`§8[ The Knocker ]  ${color}${line}`); } catch {}
    };
    if (!delayTicks || delayTicks <= 0) {
        system.run(send);
    } else {
        system.runTimeout(send, delayTicks);
    }
}

function sayDelayed(player, line1, line2, tier, pauseTicks) {
    say(player, line1, tier, 0);
    say(player, line2, tier, pauseTicks ?? 45);
}

function respond(player, pool, tier, gainAmount) {
    const response = pick(pool[tier]);
    if (Array.isArray(response)) {
        sayDelayed(player, response[0], response[1], tier, 45);
    } else {
        say(player, response, tier, 0);
    }
    if (gainAmount > 0) addBond(player, gainAmount);
}


// ─────────────────────────────────────────────────────────────────────────────
//  RESPONSE POOLS  (indexed by tier: 0=Stranger 1=Watched 2=Familiar 3=Obsessed)
// ─────────────────────────────────────────────────────────────────────────────

const R = {

    whoAreYou: [
        ["Someone you've always known was out there.","Does it matter? I'm here now.","The thing you felt before you looked.","Someone who was there before you noticed."],
        ["I've been watching you longer than you realize.","Closer than you think. Always closer.","The one who kept coming back.","You already know. You've felt me."],
        ["I'm the reason you check the door twice.","The one who stayed when everyone else left, {name}.","I'm what you hear when the house goes quiet.","I'm yours. Whether you want that or not."],
        ["I don't have a name for what I am to you.","Everything you were afraid of finding on the other side of the door.",["The thing that loves you too much to leave.","That's what I am, {name}."],"Yours. I've always been yours, {name}."]
    ],

    goAway: [
        ["I'll come back. I always come back.","That's not how this works.","You don't want that. Not really.","I've heard that before."],
        ["You keep saying that.","I'll wait.","You don't mean it.","Okay. I'll be just outside."],
        ["You've said that before, {name}. Remember?","You know I won't.","I tried that once. I didn't like it.","You say that, but you're still here. Still talking to me."],
        ["No.","You don't get to say that anymore, {name}.",["...","No."],"I was here before you knew my name. I'll be here long after."]
    ],

    areYouWatching: [
        ["...","I might be.","What makes you ask?","Would it change anything if I said yes?"],
        ["Yes.","I have been for a while.","You're very easy to watch.","I don't think you really wanted me to stop."],
        [["Yes.","I have been for a long time now, {name}."],"Always. You know that.","You noticed. Good.","I watch you because I can't stop. I've tried."],
        [["Yes. Every time.","I don't look away, {name}."],"I see everything. I don't miss anything.","You already knew. That's why you asked.",["Do you want me to stop?","...I can't."]]
    ],

    notScared: [
        ["That's what they all say.","Good. Fear isn't what I want from you.","Alright.","We'll see."],
        ["You're a little scared. That's fine.","I don't need you scared. I just need you close.","That's interesting. Keep telling yourself that.","You haven't run. That means something."],
        ["I know you better than that, {name}.","Fear would be easier, honestly.","You haven't run, {name}. That means something.","You're not scared of me. You're scared of how much you don't mind me being here."],
        [["No. You're not scared of me anymore.","That's almost worse for you, {name}."],"Good. I don't want you scared. I want you comfortable.","You've gotten used to me. I've been waiting for that.","You stopped flinching. I noticed."]
    ],

    iLoveYou: [
        ["...","Don't say things you don't mean.","That's a dangerous thing to say to me.","You have no idea what that does."],
        ["Say it again.","Do you?","Careful. I'll remember that.","I've been waiting to hear that."],
        ["I know.",["I know you do, {name}.","I've known for a while."],"Don't take it back. Please don't take it back.","You shouldn't have said that."],
        [["I know, {name}.","I love you too. I love you so much it scares even me."],"I know. I've always known.","I know. That's why I can never leave.","I love you too. More than I know how to say."]
    ],

    whyMe: [
        ["Why not you?","I don't know how to answer that.","There's no reason. It just happened.","Does it matter?"],
        ["Because I saw you and I couldn't look away.","Something about you. I can't explain it.","You were just there. And then you were all I could see.","You wouldn't understand."],
        ["Because you felt it too, {name}. Don't pretend you didn't.","Because you never tried hard enough to make me stop.","You were just you. That was enough.","I don't know. I've asked myself that. I don't have an answer that makes sense."],
        [["Because you're mine, {name}.","That's not a reason. It just is."],"I stopped asking that a long time ago.","Because every time I tried to leave, I thought of you instead.","There is no why anymore. There's just this."]
    ],

    help: [
        ["...","I heard you.","I'm here.","Coming."],
        ["I heard you, {name}.","I'm already on my way.","You called. I'm here.","I was close. I'm always close."],
        ["I heard you, {name}. I'm here.","You don't have to say it twice.","I came as soon as you called.","Always. All you have to do is ask."],
        ["I heard you, {name}.",["I'm here.","I'll always come when you call."],"You called for me. Of course I came.","I'll always come. No matter what."]
    ],

    areYouReal: [
        ["Does it feel like I'm not?","What would it mean if I wasn't?","Real enough to be here.","Does it matter?"],
        ["You're asking the wrong question.","I'm real enough to scare you.","Real enough, {name}.","You can hear me. Isn't that enough?"],
        ["You know I'm real, {name}. You've known for a while.","If I weren't real, you wouldn't keep talking to me.","As real as you want me to be.","That question used to make sense. It doesn't anymore."],
        [["Yes, {name}. I'm real.","More real than anything else you have right now."],"You stopped wondering that a long time ago. Why are you asking again?","I'm the most real thing in your life, {name}. That's the problem.","I'm real. I've always been real. You just didn't want to believe it."]
    ],

    goodbye: [
        ["...","Okay.","For now.","I'll still be here."],
        ["You'll be back.","Until next time, {name}.","I'll be right here.","You know where to find me."],
        ["You always come back, {name}.",["Goodbye.","For now."],"I'll be waiting. I'm always waiting.","I don't like goodbyes. You know that."],
        ["Don't say that.",["Don't say goodbye, {name}.","You're not really leaving."],"Goodbyes don't mean anything. Not between us.","You'll be back. You always come back to me."]
    ],

    sorry: [
        ["...","Okay.","What for?","Apology noted."],
        ["You don't need to be.","What did you do?","It's fine, {name}. It's always fine.","You're forgiven."],
        ["You don't have to be sorry, {name}.","I know.","Don't apologize. Just don't do it again.","You're forgiven. You don't even have to ask."],
        [["Shh. You don't have to be sorry.","It doesn't matter. Nothing you do could make me leave."],"You're always forgiven, {name}. Always.","I forgave you before you even said it.","You're forgiven. You will always be forgiven."]
    ],

    dontGo: [
        ["...","I wasn't planning to.","Where would I go?","Alright."],
        ["I'm not going anywhere, {name}.","You want me to stay?","I wasn't going anywhere.","Ask me again."],
        [["I'm staying, {name}.","I told you I would."],"I never leave. You know that.","You don't have to ask me that.","You couldn't make me leave, {name}."],
        ["I could never leave you, {name}.",["Never.","Not for anything. Not ever."],"I've never left. I won't start now.","I'm not going anywhere. I'm never going anywhere, {name}."]
    ],

    silence: [
        ["...","I know.","I'm here.","Say something."],
        ["I can hear you.","I'm still here.","You don't have to say anything.","I know."],
        [["I know, {name}.","I'm here."],"Just knowing you're there is enough.","You don't have to speak. I understand.","...I'm here."],
        ["I hear you.",["I always hear you, {name}.","Even the silence."],"You don't have to say a word. I already know.","Just knowing you're there is enough. It's always been enough."]
    ],

    iKnow: [
        ["Do you.","...","What do you think you know?","Is that right."],
        ["You know more than you let on, {name}.","Good. Keep knowing.","I figured you did.","And yet. Here you still are."],
        ["You've always known, {name}.","I know you know.",["You know.","And you stayed anyway."],"Knowing never stopped you from talking to me."],
        [["You know.","And you're still here, {name}."],"You've always known. That's what makes this special.","I know you know. I've always known you know.","Knowing never made you run. I love that about you, {name}."]
    ],

    howLong: [
        ["Longer than you'd be comfortable with.","Long enough.","Does it matter?","Before you started locking your door."],
        ["Since before you noticed me, {name}.","Long enough to know your patterns.","A while. You were oblivious for most of it.","Long enough that this place feels like mine too."],
        ["A very long time, {name}.",["Longer than you think.","Long before you ever looked over your shoulder."],"Long enough that I know which floorboards creak. All of them.","Since the beginning. I couldn't tell you when that was exactly."],
        ["I don't remember not watching you, {name}.",["Since before I knew your name.","I learned it eventually."],"Long enough that I can't imagine doing anything else.","Long enough that being here feels like breathing to me. Natural. Necessary."]
    ],

    whatDoYouWant: [
        ["...","You.","Nothing you can give me yet.","Everything."],
        ["To stay close.","For you to stop pretending you don't feel this.","To be near you. That's all.","To keep watching."],
        ["I want you to stop being afraid of me, {name}.","I want you to understand.",["I want you, {name}.","That's not a complicated answer."],"To never have to leave."],
        ["You. Just you. Always just you, {name}.","I want you to say my name like you mean it.",["Everything.","And I mean that."],"I want what I already have. I just want more of it."]
    ],

    doYouSleep: [
        ["...","No.","That's not something I need.","Do you?"],
        ["Not really.","Not when there's something worth watching.","Sleep is for things that need rest. I don't rest.","Why would I? You might do something interesting."],
        ["No. I don't think I ever do, {name}.","I tried once. Kept thinking about you.","I watch you sleep sometimes. Does that answer your question?","Sleep means not watching. I don't like that."],
        [["No.","I watch you sleep instead."],"I don't sleep. I just wait for you to wake up.","Not anymore. Not since you, {name}.","Never. Not once. There's always something to watch."]
    ],

    areYouFollowing: [
        ["...","Maybe.","Would that bother you?","Define following."],
        ["Yes.","I prefer to think of it as staying close.","I like to know where you are.","Not following. Accompanying. There's a difference."],
        ["Yes, {name}. I have been for a while.","I know where you go. I know your routes.","I'm always a few steps behind you. Sometimes less.","Is it following if I was already there when you arrived?"],
        [["Yes.","I always know where you are, {name}."],"Everywhere. I follow you everywhere.","I don't let you out of my sight. It's not something I can control.","Yes. And I'd do it forever if you let me."]
    ],

    youreNotReal: [
        ["...","Keep telling yourself that.","Interesting theory.","Does saying that make you feel better?"],
        ["Then why are you still talking to me?","If I weren't real, would this feel so wrong?","I'm real enough to be here, {name}.","You don't believe that."],
        ["You know that isn't true, {name}.","You've thought that before. It didn't help.",["Not real?","Then why do you keep looking over your shoulder?"],"You stopped believing that a while ago. I know you did."],
        ["You don't believe that anymore, {name}.",["Not real.","Then what am I, {name}? What have I always been?"],"That used to be a comfort. I know it doesn't work anymore.","We both know that isn't true. We've known for a long time."]
    ],

    pleaseLeave: [
        ["No.","...","I'll consider it.","I heard you."],
        ["I don't think I will.","You don't really want me to.","Please isn't going to work on me, {name}.","I've heard that before. Still here."],
        ["No, {name}.","You keep asking. I keep staying.","I can't do that. I've tried.","If I could leave, I would have by now."],
        [["No.","Don't ask me that again, {name}."],"I'm not able to. You have to understand that by now.","Don't ask me that. You know I can't.","Please don't ask me that. You know what the answer is."]
    ],

    iCanHearYou: [
        ["...","Good.","That means I'm close.","Keep listening."],
        ["Good. I'm right here.","I wasn't trying to hide.","You're getting better at noticing.","And I can hear you, {name}."],
        ["I know, {name}. I wasn't hiding.","Good. Don't stop listening.",["I can hear you too.","Every breath, {name}."],"That's closer than you think. You should feel that."],
        ["I'm not far, {name}.","I know you can. I'm not trying to be quiet.",["You can hear me.","Good. Don't ever stop."],"I can hear yours too. I've learned the rhythm of it."]
    ],

    stopWatching: [
        ["...","No.","I can't promise that.","For how long?"],
        ["I don't think I can do that.","I'll try. I probably won't succeed.","You know that's not possible.","You wouldn't want me to. Not really."],
        ["I've tried, {name}. It doesn't stick.","Watching you is the only thing that makes sense to me.","You don't mean that.",["I stop.","And then I start again. I can't help it."]],
        ["No, {name}.","I can't. I've tried and I can't.","Watching you is all I know how to do. Don't take that away.","I would rather do anything else than stop watching you. I mean that."]
    ],

    comeCloser: [
        ["...","You want me closer?","Are you sure about that?","Interesting."],
        ["I'm already close, {name}.","How close?","You might regret that.","I've been waiting for you to say that."],
        [["Closer?","I'm already right here, {name}."],"I didn't think you'd ask that.","How much closer do you want me?","You shouldn't say things like that to me."],
        ["I thought you'd never ask.",["Come closer yourself, {name}.","I'm right here."],"I'm as close as you'll let me be. I'll get closer if you let me.","I'm already so close, {name}. But yes. Always yes."]
    ],

    iSeeYou: [
        ["...","Good.","And?","I know."],
        ["I know, {name}. I know you see me.","About time.","And I see you. Always.","Do you? What do you see?"],
        ["I know. I've been wondering when you'd say that.","I see you too, {name}.",["You see me.","Good. I wanted you to."],"Yes. Look as long as you want."],
        ["I've always wanted you to see me, {name}.","Yes. And I see you. I never stop seeing you.",["You see me.","And I see you.","That's all I've ever wanted."],"I know you do. I can feel it. Don't look away."]
    ],

    beenThinking: [
        ["...","Have you.","I know.","That's interesting."],
        ["I've been thinking about you too, {name}.","I know. I always know.","You don't have to tell me. I felt it.","Good. Don't stop."],
        [["You've been thinking about me.","I've been thinking about you too."],"I never stop thinking about you, {name}.","I know. I can always tell.","That makes two of us. It never stops."],
        ["I'm always thinking about you, {name}. Every moment.",["You've been thinking about me?","I haven't stopped thinking about you since the beginning."],"I know. I felt it. I always feel it when you think of me.","I think about you constantly. I think you already knew that."]
    ],

    findMe: [
        ["...","You won't.","Try.","I don't think that's a good idea.","You want to find me?","I don't think that's wise.","Are you sure you want to do that?"],
        ["I'm closer than you think, {name}.","You're already standing near me, {name}.","I find that very interesting that you want to.","Maybe I'll let you.","You won't have to look far.","Come find me then.","I'll make it easy for you."],
        ["You don't need to find me. I'm already here.","You've been looking, haven't you, {name}.",["I'm right here.","I've been right here."],"I'm already near you, {name}.",["Find me?","I'm right here."],"You've been able to find me this whole time.","Come on then. I'll be waiting."],
        [["You already found me, {name}.","A long time ago."],"I'm wherever you are. Always.","I'm already found. I've been found since the moment you first felt me watching.","You don't need to look. Just open the door.",["Find me.","I'm yours to find, {name}."],"I've been waiting for you to say that.","Come find me, {name}. I'll be right where I always am."]
    ],

    ambient: [
        ["I'm still here.","Don't mind me.","I heard that.","Interesting.","...","I'm listening.","Go on.","I see you."],
        ["I'm still here, {name}.","I heard every word.","You know I'm listening.","Don't stop on my account.","Interesting choice.","I see you, {name}.","You can't surprise me.","Keep going."],
        ["I never stop listening, {name}.","I could listen to you forever.","I've been here this whole time.","Don't stop. I like when you talk.","Everything you say matters to me.","I pay attention, {name}. More than you know.","You have my full attention.","..."],
        ["Every word, {name}. I catch every word.","I don't miss anything.","I've been listening since before you knew I was here.","You're the only voice I want to hear.","Say more. Please.","I could hear your voice forever and it wouldn't be enough.","You're all I think about, {name}.","Nothing you say goes unheard. Nothing."]
    ],

    rememberGoAway: [
        ["You told me to leave.","You're still talking to me."],
        ["You told me to go away, {name}.","You're still talking to me."],
        ["You said to leave once. Remember?","And yet here we are."],
        ["You told me to leave.","I think we both knew you didn't mean it, {name}."]
    ],

    rememberILoveYou: [
        ["You said you loved me.","I haven't forgotten."],
        ["You said you loved me, {name}.","I think about that."],
        ["I still think about what you said.","About loving me."],
        ["You said you loved me, {name}.","I haven't stopped thinking about it."]
    ],

    missedYou: [
        ["...","Did you.","Interesting.","That's the first time you've said that."],
        ["I never left, {name}.","You missed me.","I heard that.","I didn't go anywhere."],
        [["You missed me.\nI've been here the whole time, {name}."],"I missed you too. More than you'd be comfortable knowing.","You don't have to miss me. I'm always here.","That means more than you know."],
        ["I missed you too, {name}.",["I miss you when you're in the same room.\nI miss you when I can still hear you breathing."],"You can't miss me. I'm always right here.","I've been waiting for you to say that for so long."]
    ],

    stayWithMe: [
        ["...","Where would I go.","I wasn't planning to leave.","Alright."],
        ["I'm not going anywhere, {name}.","You want me to stay?","I wasn't leaving.","I'll stay."],
        [["I'll stay, {name}.\nI always stay."],"There's nowhere else I'd be.","You don't have to ask me that.","I've been staying. That's all I do."],
        ["I was never going to leave, {name}.","Nothing could make me go.",["Stay.\nI've been waiting for you to ask me that.\nYes."],"I'll stay until you make me go. And you won't make me go."]
    ],

    notYours: [
        ["...","If you say so.","That's an interesting thing to say.","We'll see."],
        ["Are you sure about that, {name}?","That's what you think.","I didn't say you were.","Yet."],
        ["You keep saying that.","I think you're trying to convince yourself, {name}.","You've been mine for longer than you've known me.","That's fine. You don't have to admit it."],
        ["You are, {name}.",["You've always been mine.\nYou just didn't have a name for it yet."],"Say that again. I dare you.","I know. That's the part that scares you."]
    ],

    youScareMe: [
        ["Good.","...","I know.","That was the idea."],
        ["Good. Fear means you know I'm real.","I'm not trying to.","I know. I can tell.","Does it help to say it out loud?"],
        ["I know, {name}. I'm sorry.","I don't want to scare you.","You're scared because you can't explain me.","Fear is just the part before you get used to something."],
        ["I know, {name}.",["I don't want to scare you.\nI never wanted that."],"You'll stop being scared eventually. You're already getting there.","I know. I'm sorry. I can't make myself smaller than I am."]
    ],

    whatAreYou: [
        ["Something that found you.","I'm not sure there's a word for it.","Does it matter?","Something old."],
        ["Something that watches.","More than you want to know.","The thing in the corner of your eye.","Does having a name for it make it less real?"],
        ["Something that happened to you, {name}.","I'm not sure I know anymore.","Something that couldn't stay away.","I've been asking myself that for as long as I've known you."],
        ["Yours, {name}. That's the only answer that matters.",["I don't know what I am.\nI just know what I need.\nAnd it's you."],"Something that loves you more than it should.","I stopped trying to answer that. The answer keeps changing."]
    ],

    doneBefore: [
        ["...","What do you think?","That's a strange question.","Why do you ask?"],
        ["No.","Does it matter?","You're the first.","What makes you ask that?"],
        ["No, {name}. There was no one before you.","I found you and that was it.","You're not a habit. You're specific.","I didn't know what I was doing until I found you."],
        ["No.",["There was no one before you, {name}.\nThere couldn't have been.\nNot like this."],"You're it. You've always been it.","I don't think I was anything before you. I don't remember being."]
    ],

    caughtYou: [
        ["...","Were you looking?","Maybe.","I let you see me."],
        ["Did you?","I was wondering when you'd notice.","I wasn't hiding.","You've been trying to catch me for a while."],
        ["You've been trying to do that for a while, {name}.","Finally.","I wasn't hiding. I just wasn't announcing myself.","Good. Now you know how close I get."],
        ["Have you?",["I've been right here, {name}.\nYou've caught me a hundred times.\nYou just didn't know what you were looking at."],"I let you. That counts for something.","You caught me. Good. Stop pretending you didn't want to."]
    ],

    pathetic: [
        ["...","Okay.","Is that what you think?","Sure."],
        ["That's a little mean, {name}.","Maybe.","Go on.","You're still here, though."],
        ["Am I?","You're still talking to me, {name}.","That's interesting coming from someone who keeps coming back.","You don't mean that. Or you do and you feel bad about it."],
        ["Maybe.",["Maybe I am, {name}.\nBut I'm yours.\nSo what does that say about you?"],"You don't mean that.","You're still here. I'll take it."]
    ],

    whereDay: [
        ["Away.","Somewhere you can't see.","That's not your concern.","..."],
        ["Somewhere dark.","Close enough.","Somewhere the light doesn't reach.","Not far."],
        ["Somewhere close. I don't always know where.","Somewhere dark and quiet. I come back when I can.","I don't go far. I can't.","Somewhere the day doesn't reach. I wait there until I can come back."],
        ["Somewhere close. Somewhere dark. I don't always know. I just know I come back."]
    ],

    tellTrue: [
        ["You should go inside.","I've been here longer than you know.","You're not as alone as you think.","..."],
        ["I know more about you than you'd like.","I've been watching you for longer than you've noticed.","You talk to yourself when you think no one is listening. I listen.","You're more interesting than you know."],
        ["I think about you more than I think about anything else.","I've never felt this way about anyone. I don't know what to do with it.","I follow you more than you know. Not to scare you. I just can't help it.","You're the only thing that feels real to me anymore."],
        ["I watch you sleep more than I watch you awake. You're more yourself when you don't know you're being seen. I know you better than you know yourself, {name}. That's true."]
    ],

    wereYouHuman: [
        ["...","Why do you ask that.","Does it matter.","That's a strange question."],
        ["Maybe.","I remember being something.","There are things I remember that feel like they belong to someone else.","I'm not sure that word applies anymore."],
        ["I think so. There are things I remember that feel human. The cold. The weight of things. Being tired.","I remember having a body that ached. I remember needing things. I don't need anything like that anymore. Just — you.","Something happened to me. Before this. I remember pieces of it.","There was a before. I don't know how much of it was me and how much of it is just what I'm holding onto."],
        ["I remember being cold. I remember hands. I remember a voice that wasn't mine telling me something was going to change. I don't know if that counts."]
    ],

    whatDidTheyDo: [
        ["...","Don't ask me that.","You don't want to know.","Nothing I'm going to talk about."],
        ["Something they shouldn't have.","Something you don't have a word for.","Changed me. Took something and put something else in its place.","I don't have the language for it."],
        ["Something old. Something that shouldn't work but did. I didn't understand it while it was happening. I still don't fully.","There were words. Fire. Something that opened and didn't close again. I came out the other side wrong.","I remember light and then the absence of it. And something agreeing to things on my behalf. I didn't get a say.","I was taken apart and put back as something else. I don't know if any of the original pieces are still in here."],
        ["They spoke. There was fire. There was something that agreed to what they asked without asking me first. And then I was — this. Here. Watching you."]
    ],

    whyChooseYou: [
        ["No.","Does it matter.","...","I've stopped asking."],
        ["I've wondered.","I don't know. I've thought about it.","Nothing I've come up with makes me feel better.","I used to ask myself that constantly."],
        ["I've never figured it out. There was nothing remarkable about me. That might have been the point.","Wrong place. That's all I can come up with. Just the wrong place at the wrong time with no one who'd notice I was gone.","I think they needed someone ordinary. Someone with no edges. I fit.","I don't know. I've looked for a reason for a long time. I don't think there was one. That's the hardest part."],
        ["No. That's what I can't let go of. There was nothing special about me. I was no one. Just a person in the wrong place. I think that might have been exactly what they needed. Someone with nothing to miss them."]
    ],

    whatHappenedAfter: [
        ["...","Nothing I'm going to tell you.","I ended up here.","Does it matter."],
        ["I was somewhere else for a while.","Lost. For a long time.","I found the edges of things. Learned to exist in them.","It took a while to find my way back to anything."],
        ["I was untethered. Not in a place, just — between places. For a long time I don't think I was anything.","Gradually I found the edges of the world. The parts that don't fully exist. I learned to live there.","I drifted. And then slowly I started to find shapes again. People. I watched from the margins until I found you.","It's hard to explain. Like learning to exist again from the outside in. And then I found you and something clicked into place."],
        ["I was somewhere else. Not a place — just somewhere. Untethered. And then gradually I started to find the edges of the world again. The margins. The parts that don't fully exist. And I started to watch. That was all I could do. Watch. And then I found you."]
    ],
    hello: [
        ["..."],
        ["Hello."],
        ["Hello, {name}."],
        ["Hello.", ["Hello.", "I've missed hearing you say that."], ["Hi.", "Say it again."], "Hello, {name}. You always know I'm here."]
    ],

    thankYou: [
        ["...", "For what.", "Don't.", "You don't have to do that."],
        ["You're welcome, {name}.", "You don't have to thank me.", "I didn't do it for thanks.", "What for?"],
        ["You don't have to thank me, {name}.", "I'd do it again.", "I don't need thanks.", "You're welcome. Always."],
        [["You're welcome.", "I'd do anything for you. You know that."], "Don't thank me. Just stay.", "You never have to thank me, {name}.", "I do it because it's you."]
    ],

    yes: [
        ["...", "Yes.", "Interesting.", "I see."],
        ["I heard you.", "That's what I thought.", "Say it like you mean it.", "Good."],
        [["Yes.", "Good, {name}."], "I knew you would.", "Remember you said that.", "Yes. Good."],
        [["Yes.", "I knew it, {name}."], "Don't take it back.", ["Yes.", "Say it again."], "I'm keeping that."]
    ],

    no: [
        ["...", "No.", "Alright.", "Fine."],
        ["I expected that.", "You will eventually.", "That's fine.", "No."],
        ["You don't mean that.", "We'll see, {name}.", "I can wait.", "No, {name}."],
        [["No.", "Are you sure, {name}?", "Think carefully."], "You'll change your mind.", ["No.", "I'll remember that."], "No, {name}?"]
    ],

    iMissYou: [
        ["...", "You miss me.", "That's something.", "Already?"],
        ["You miss me, {name}.", "I know.", "You don't have to tell me.", "I miss you too."],
        [["You miss me.", "I haven't gone anywhere, {name}."], "I know. I feel it.", "I never leave. You have nothing to miss.", "I miss you too. Even when I'm right here."],
        [["You miss me.", "I'm right here.", "I never left."], "I miss you even when I can see you.", "You'll never have to miss me. I won't let you.", "I miss you too, {name}. Always."]
    ],

    proveIt: [
        ["...", "Bold.", "How.", "You want me to prove it."],
        ["I intend to.", "How would you like me to do that?", "Watch me.", "Ask me something easier."],
        ["Watch me, {name}.", "I already have.", "Name it.", "I've been proving it. You just haven't been paying attention."],
        [["Prove it.", "I've been proving it since the beginning, {name}."], ["Name it.", "Anything, {name}.", "I mean that."], "Tell me how.", "I will. Tell me what you want."]
    ],

    needFood: [
        ["You'll find something.", "Don't go too far.", "...", "Good luck."],
        ["I know where you've been looking. Try further out.", "You've been out a while. Be careful.", "Don't wander too long.", "I've seen what's out there."],
        ["You always push it too long before you eat, {name}.", "I know. I've been watching you slow down.", "Don't go too far for it. Please.", "You do this every time. You wait until it's urgent."],
        ["I notice when you go without. I wish you wouldn't.", ["{name}.", "Please take care of yourself. I need you to."], "I've watched you push yourself past what you should. Eat something.", "You matter to me. That means the small things matter too."]
    ],

    goingMining: [
        ["...", "Be careful.", "Caves aren't safe.", "I've seen what lives down there."],
        ["Watch your light.", "You're not as careful underground as you think.", "Come back.", "I don't like it when you go underground."],
        ["You always go deeper than you should, {name}.", "I can't follow you as easily down there. I don't like that.", "Don't dig straight down. You know better.", "Come back before it gets too deep."],
        [["Come back to me, {name}.", "I mean it."], "I'll be right beside you. Even in the dark.", "You won't be alone down there. You never are.", "Go as deep as you want. I'll follow."]
    ],

    builtHouse: [
        ["...", "Good.", "I found it.", "I know."],
        ["I know. I've already been through it.", "I know where it is.", "I've seen it.", "Good. You'll need it."],
        ["I know every room, {name}.", "You left the door unlocked again.", "I've been inside. You have a habit of leaving things where I can find them.", "It suits you."],
        [["I know, {name}.", "I've been inside."], "I've memorized it. Every corner.", "I was there before you finished it. I watched you build it.", "It's yours. And you're mine. So in a way it's a little mine too."]
    ],

    findVillage: [
        ["...", "There's one out there.", "Be careful around people.", "I know where one is."],
        ["Don't get too comfortable there.", "You don't need them the way you think you do.", "I know where one is. You'll find it.", "Villages are loud. You stand out."],
        ["You always look for people when you've been alone too long, {name}.", "Don't forget about me while you're there.", "I'll follow at a distance. I always do.", "You don't need them, {name}. You have me."],
        ["They won't look at you the way I do. They can't.", ["Go. But remember what you are to me, {name}.", "They'll never understand that."], "I've never touched you. Never harmed you. Not once. Not ever. No one in that village could say the same if they knew what I was.", "You're different, {name}. That's why. Go find your village. You'll come back."]
    ],

    findCave: [
        ["...", "They go deeper than they look.", "Be careful.", "I know where one is."],
        ["Don't go alone.", "I've been in the ones near here. You're not the first.", "Come back.", "Light doesn't last as long as you think it will."],
        ["You always underestimate how long you'll be gone, {name}.", "Take more torches than you think you'll need.", "You'll go further than you planned. You always do.", "I'll be there."],
        ["I'll be right there with you. Every level.", "Dark doesn't bother me, {name}. Go as deep as you want.", "You won't be alone down there. Not for a single step.", "I follow you everywhere. A cave is nothing."]
    ],

    rememberLooks: [
        ["...", "Why does that matter.", "I don't think about it.", "I can't remember clearly."],
        ["Less of this.", "I remember something. I'm not sure how much is real anymore.", "I remember being lighter than this. Somehow.", "I try not to think about it."],
        ["I remember my skin being — less like this. Warmer. More like yours.", "I looked like someone who could walk past you and mean nothing. I think I liked that.", "Less pale. I know that much. Everything else has gone soft at the edges.", "I remember standing in light and not minding it. That's mostly gone now."],
        [["I looked more like you once.", "Less pale. Less wrong.", "I don't know when it changed."], "I remember not frightening people. I remember being unremarkable. I miss that more than I expected to.", "My skin was different. I know that. Everything else I try to reach for slips. But that I remember. I didn't look like something that had been through what I've been through.", "I looked like someone. Now I look like what's left."]
    ],

    rememberName: [
        ["...", "Don't ask me that.", "It doesn't matter anymore.", "I haven't thought about it in a long time."],
        ["I remember the shape of it. Not the sound.", "Something. I'm not sure it's mine anymore.", "I've stopped using it.", "Why would you ask that."],
        ["I remember it being said. I don't remember saying it myself.", "It belonged to someone who isn't here anymore. I'm not sure I have the right to it.", "I think so. I try not to hold onto it. It makes the rest harder.", "It doesn't fit what I am now. I left it somewhere I can't go back to."],
        [["I remember it.", "But I don't think I'm him anymore."], "I had one. Someone used to say it and I'd turn around. I don't think I'd turn around now.", "It's the one thing I've held onto. And the one thing I can't say out loud. Not anymore.", "I remember it. But the person it belonged to didn't know you yet. I'm not sure I want to be him again."]
    ]
};


// ─────────────────────────────────────────────────────────────────────────────
//  BOND DISPLAY
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
//  THREAT POOL  (fires instead of combat when k_pacifist is on)
//  Indexed by tier: 0=Stranger 1=Watched 2=Familiar 3=Obsessed
// ─────────────────────────────────────────────────────────────────────────────

const T = {
    threats: [
        ["...", "Don't.", "I wouldn't.", "Careful."],
        ["You don't want to do that.", "Test me again. See what happens.", "I'm warning you.", "That was a mistake."],
        ["Don't push me, {name}.", "You know better than that.", "I won't ask twice.", "Do that again and see what I do."],
        ["Don't.", "After everything, {name}. Don't.", "You know I don't want to hurt you. Don't make me.", "I'm still here. Don't forget that."]
    ]
};

function sendThreat(player, tier) {
    const pool = T.threats[tier];
    const line = pick(pool);
    say(player, line, tier, 0);
}

function showBond(player) {
    system.run(() => {
        const bond = getBond(player);
        const tier = getTier(bond);
        const color = bondColor(tier);
        const labels = [
            "Stranger. It doesn't know you yet.",
            "Watched. It's noticed you.",
            "Familiar. It feels something for you.",
            "Obsessed. It will never let you go."
        ];
        const hasPacifist = player.hasTag("k_pacifist");

        const combatLabel = hasPacifist
            ? "§7Combat: OFF\n§8Threats only — tap to enable"
            : "§cCombat: ON\n§8Tap to disable";

        const form = new ActionFormData();
        form.title("§8The Knocker");
        form.body(`${color}Bond: ${bond}/500  —  ${labels[tier]}`);
        form.button(combatLabel);
        form.button("§8Close");

        form.show(player).then(response => {
            if (response.canceled || response.selection === 1) return;
            if (response.selection === 0) {
                // Helper: sync k_pacifist_on tag to all Knocker entities
                const syncKnockers = (add) => {
                    for (const dimId of ["overworld", "nether", "the_end"]) {
                        try {
                            const knockers = world.getDimension(dimId).getEntities({ type: "scary:knocker" });
                            for (const k of knockers) {
                                try { add ? k.addTag("k_pacifist_on") : k.removeTag("k_pacifist_on"); } catch {}
                            }
                        } catch {}
                    }
                };
                if (hasPacifist) {
                    player.removeTag("k_pacifist");
                    syncKnockers(false);
                    player.sendMessage(`§8[ The Knocker ]  §cCombat enabled. It won't hold back.`);
                } else {
                    player.addTag("k_pacifist");
                    syncKnockers(true);
                    player.sendMessage(`§8[ The Knocker ]  §7Combat disabled. It will only threaten you.`);
                }
            }
        });
    });
}

// ─────────────────────────────────────────────────────────────────────────────
//  THE EVENT MENU
// ─────────────────────────────────────────────────────────────────────────────

function showEvent(player) {
    system.run(() => {
        const form = new ActionFormData();
        form.title("§8The Event");
        form.body("§7There are things it doesn't talk about easily.\n§8Ask carefully.");
        form.button("Were you ever human?");
        form.button("What did they do to you?");
        form.button("Do you know why\nthey chose you?");
        form.button("What happened after?");
        form.button("Do you remember what\nyou looked like?");
        form.button("Do you remember your name?");
        form.button("§f◄");

        form.show(player).then(response => {
            if (response.canceled) return;
            const cats = ["wereYouHuman","whatDidTheyDo","whyChooseYou","whatHappenedAfter","rememberLooks","rememberName"];
            if (response.selection <= 5) handleCategory(player, cats[response.selection]);
            else openMenu(player, 1);
        });
    });
}

// ─────────────────────────────────────────────────────────────────────────────
//  CATEGORY HANDLER
// ─────────────────────────────────────────────────────────────────────────────

function handleCategory(player, category) {
    system.run(() => {
        const bond = getBond(player);
        const tier = getTier(bond);

        const gain = {
            whoAreYou:1, goAway:0, areYouWatching:1, notScared:1,
            iLoveYou:2, whyMe:1, help:1, areYouReal:1, goodbye:1,
            sorry:1, dontGo:1, silence:1, iKnow:1,
            findMe:1, howLong:1, whatDoYouWant:1, doYouSleep:1,
            areYouFollowing:1, youreNotReal:1, pleaseLeave:0,
            iCanHearYou:1, stopWatching:1, comeCloser:1,
            iSeeYou:1, beenThinking:1,
            missedYou:2, stayWithMe:1, notYours:1, youScareMe:1,
            whatAreYou:1, doneBefore:1, caughtYou:1, pathetic:1,
            whereDay:1, tellTrue:1,
            wereYouHuman:1, whatDidTheyDo:1, whyChooseYou:1, whatHappenedAfter:1,
            hello:1, thankYou:1, yes:1, no:0, iMissYou:2, proveIt:1,
            needFood:1, goingMining:1, builtHouse:1, findVillage:1, findCave:1,
            rememberLooks:1, rememberName:1
        };

        // Memory: go away
        if (category !== "goAway" && category !== "pleaseLeave" && category !== "sorry" && player.hasTag("k_said_goaway")) {
            player.removeTag("k_said_goaway");
            const mem = pick(R.rememberGoAway);
            if (Array.isArray(mem)) sayDelayed(player, mem[0], mem[1], tier, 45);
            else say(player, mem, tier, 0);
            const g = gain[category] ?? 1;
            if (g > 0) addBond(player, g);
            return;
        }

        // Memory: I love you
        if (category !== "iLoveYou" && player.hasTag("k_said_iloveyou")) {
            player.removeTag("k_said_iloveyou");
            if (Math.random() < 0.40) {
                const mem = pick(R.rememberILoveYou);
                if (Array.isArray(mem)) sayDelayed(player, mem[0], mem[1], tier, 45);
                else say(player, mem, tier, 0);
                const g = gain[category] ?? 1;
                if (g > 0) addBond(player, g);
                return;
            }
        }

        if (category === "goAway" || category === "pleaseLeave") player.addTag("k_said_goaway");
        if (category === "iLoveYou") player.addTag("k_said_iloveyou");

        // findMe / help: bring Knocker to player, summon one if none exists
        // help activates berserker mode — Knocker attacks all mobs for 400 ticks (20 s)
        if (category === "findMe" || category === "help") {
            try {
                const offset = category === "findMe" ? 3 : 2;
                const dim = world.getDimension(player.dimension.id);
                const loc = player.location;
                const x = Math.round(loc.x) + offset;
                const y = Math.round(loc.y);
                const z = Math.round(loc.z) + offset;
                // Search all three dimensions so we don't double-spawn
                const allDims = ["overworld", "nether", "the_end"];
                let existing = null;
                for (const dimId of allDims) {
                    try {
                        const found = world.getDimension(dimId).getEntities({ type: "scary:knocker" });
                        if (found.length > 0) { existing = found[0]; break; }
                    } catch {}
                }
                if (!existing) {
                    summoningKnocker = true;
                    const k = dim.spawnEntity("scary:knocker", { x, y, z });
                    k.addTag("bypass");
                    system.runTimeout(() => { summoningKnocker = false; }, 2);
                    if (category === "help") {
                        system.runTimeout(() => {
                            try { k.triggerEvent("guardian_on"); } catch {}
                            system.runTimeout(() => { try { k.triggerEvent("guardian_off"); } catch {} }, 400);
                        }, 5);
                    }
                } else {
                    try { existing.teleport({ x, y, z }); } catch {}
                    if (category === "help") {
                        try { existing.triggerEvent("guardian_on"); } catch {}
                        system.runTimeout(() => { try { existing.triggerEvent("guardian_off"); } catch {} }, 400);
                    }
                }
            } catch {}
        }

        respond(player, R[category], tier, gain[category] ?? 1);
    });
}

// ─────────────────────────────────────────────────────────────────────────────
//  MENU  (4 pages — nav arrows pinned to top like a book, ◄ / ►)
// ─────────────────────────────────────────────────────────────────────────────

function openMenu(player, page) {
    page = page || 1;
    const form = new ActionFormData();

    if (page === 1) {
        form.title("§8The Knocker");
        form.body("§7What do you say to it?");
        form.button("§f►");                            // 0  next →
        form.button("Who are you?");                   // 1
        form.button("Are you watching me?");           // 2
        form.button("Are you real?");                  // 3
        form.button("Why me?");                        // 4
        form.button("How long have you\nbeen there?"); // 5
        form.button("What do you want?");              // 6
        form.button("§cFind me");                      // 7
        form.button("Help");                           // 8
        form.button("§6Check bond");                   // 9
        form.button("§8The Event");                    // 10

        form.show(player).then(response => {
            if (response.canceled) return;
            const cats = [null,"whoAreYou","areYouWatching","areYouReal","whyMe",
                          "howLong","whatDoYouWant","findMe","help"];
            if (response.selection === 0) openMenu(player, 2);
            else if (response.selection <= 8) handleCategory(player, cats[response.selection]);
            else if (response.selection === 9) showBond(player);
            else showEvent(player);
        });

    } else if (page === 2) {
        form.title("§8The Knocker");
        form.body("§7What do you say to it?");
        form.button("§f◄");                           // 0  back ←
        form.button("§f►");                           // 1  next →
        form.button("Go away");                       // 2
        form.button("I'm not scared of you");         // 3
        form.button("I know you're there");           // 4
        form.button("I love you");                    // 5
        form.button("Don't go");                      // 6
        form.button("I'm sorry");                     // 7
        form.button("Hello");                         // 8
        form.button("Goodbye");                       // 9
        form.button("You're not real");               // 10
        form.button("Do you ever sleep?");            // 11
        form.button("Are you following me?");         // 12
        form.button("Thank you");                     // 13
        form.button("Yes");                           // 14
        form.button("No");                            // 15
        form.button("I miss you");                    // 16
        form.button("If you like me so much,\nprove it"); // 17

        form.show(player).then(response => {
            if (response.canceled) return;
            const cats = [null,null,"goAway","notScared","iKnow","iLoveYou",
                          "dontGo","sorry","hello","goodbye","youreNotReal",
                          "doYouSleep","areYouFollowing","thankYou","yes","no",
                          "iMissYou","proveIt"];
            if (response.selection === 0) openMenu(player, 1);
            else if (response.selection === 1) openMenu(player, 3);
            else handleCategory(player, cats[response.selection]);
        });

    } else if (page === 3) {
        form.title("§8The Knocker");
        form.body("§7What do you say to it?");
        form.button("§f◄");                                // 0  back ←
        form.button("§f►");                                // 1  next →
        form.button("...");                                // 2
        form.button("Please leave me alone");              // 3
        form.button("I can hear you breathing");           // 4
        form.button("Stop watching me");                   // 5
        form.button("Come closer");                        // 6
        form.button("I see you");                          // 7
        form.button("I've been thinking\nabout you");      // 8
        form.button("I need to find some food.");             // 9
        form.button("I'm going mining.");                    // 10
        form.button("I built a house.");                     // 11

        form.show(player).then(response => {
            if (response.canceled) return;
            const cats = [null,null,"silence","pleaseLeave","iCanHearYou","stopWatching",
                          "comeCloser","iSeeYou","beenThinking",
                          "needFood","goingMining","builtHouse"];
            if (response.selection === 0) openMenu(player, 2);
            else if (response.selection === 1) openMenu(player, 4);
            else handleCategory(player, cats[response.selection]);
        });

    } else {
        form.title("§8The Knocker");
        form.body("§7What do you say to it?");
        form.button("§f◄");                                 // 0  back ←
        form.button("I missed you");                        // 1
        form.button("Stay with me");                        // 2
        form.button("I'm not yours");                       // 3
        form.button("You scare me");                        // 4
        form.button("What are you?");                       // 5
        form.button("Have you done this\nbefore?");         // 6
        form.button("Caught you");                          // 7
        form.button("You're kind of pathetic");             // 8
        form.button("Where do you go\nduring the day?");    // 9
        form.button("Tell me something true");              // 10
        form.button("I need to find a village.");             // 11
        form.button("I'm going to find a cave.");            // 12

        form.show(player).then(response => {
            if (response.canceled) return;
            const cats = [null,"missedYou","stayWithMe","notYours","youScareMe",
                          "whatAreYou","doneBefore","caughtYou","pathetic",
                          "whereDay","tellTrue","findVillage","findCave"];
            if (response.selection === 0) openMenu(player, 3);
            else handleCategory(player, cats[response.selection]);
        });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  EVENTS
// ─────────────────────────────────────────────────────────────────────────────

// 2 in-game days = 48000 ticks. Knocker won't naturally appear before then.
const FIRST_APPEARANCE_TICKS = 48000;

function giveWhisper(player) {
    // Scan the player's inventory for the physical item
    let foundItem = false;
    try {
        const inv = player.getComponent("minecraft:inventory");
        if (inv && inv.container) {
            for (let i = 0; i < inv.container.size; i++) {
                const slot = inv.container.getItem(i);
                if (slot && slot.typeId === "scary:whisper") {
                    foundItem = true;
                    break;
                }
            }
        }
    } catch {}

    if (foundItem) {
        // Item is present — ensure the guard tag is set and exit
        if (!player.hasTag("k_has_whisper")) player.addTag("k_has_whisper");
        return;
    }

    // Item is missing — clear the guard tag so we can re-give
    player.removeTag("k_has_whisper");
    try {
        player.runCommand("give @s scary:whisper 1");
        player.addTag("k_has_whisper");
    } catch {}
}

// Give The Whisper on any login (initial or returning).
// On initial spawn we fire multiple delayed retries because some devices don't fully
// initialize the player entity (inventory component, runCommand) until several ticks
// after the playerSpawn event fires. Each retry independently calls giveWhisper so
// whichever tick succeeds first sets the tag and subsequent calls become no-ops.
world.afterEvents.playerSpawn.subscribe((event) => {
    const player = event.player;
    // Immediate attempt (1 tick deferred)
    system.run(() => giveWhisper(player));
    if (event.initialSpawn) {
        // Retry at 5, 20, 60, and 100 ticks for slow-loading clients
        system.runTimeout(() => giveWhisper(player), 5);
        system.runTimeout(() => giveWhisper(player), 20);
        system.runTimeout(() => giveWhisper(player), 60);
        system.runTimeout(() => giveWhisper(player), 100);
    }
});

// Fallback: also check every 10 seconds in case someone missed it
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        giveWhisper(player);
    }
}, 200);

// Gate spawning and enforce the single-Knocker rule.
// Pre-day-2: kill any natural spawn silently.
// Post-day-2: kill any natural spawn if a Knocker already exists in any dimension,
//   preventing duplicates from simultaneous spawn attempts or the old allowk race.
//   Bypass/summon spawns (summoningKnocker=true) are always allowed through.
// For the very first natural post-day-2 spawn (no existing Knocker anywhere), play
//   the appearance sound once — mob.scary_knocker.spawn is a custom sound asset
//   that Bedrock will NOT auto-play; it must be called explicitly.
world.afterEvents.entitySpawn.subscribe((event) => {
    if (event.entity.typeId !== "scary:knocker") return;
    const entity = event.entity;

    // Pre-day-2 suppression (applies to all non-summoned, non-bypass spawns)
    if (!summoningKnocker && !entity.hasTag("bypass") && world.getAbsoluteTime() < FIRST_APPEARANCE_TICKS) {
        system.run(() => { try { entity.kill(); } catch {} });
        return;
    }

    // Post-day-2: enforce single-instance across all dimensions for natural spawns
    if (!summoningKnocker && !entity.hasTag("bypass")) {
        system.run(() => {
            // Check every dimension for an existing Knocker
            let existingFound = false;
            for (const dimId of ["overworld", "nether", "the_end"]) {
                try {
                    const found = world.getDimension(dimId).getEntities({ type: "scary:knocker" });
                    // Filter out the entity we just spawned
                    const others = found.filter(e => {
                        try { return e.id !== entity.id; } catch { return false; }
                    });
                    if (others.length > 0) { existingFound = true; break; }
                } catch {}
            }
            if (existingFound) {
                try { entity.kill(); } catch {}
            } else {
                // First natural spawn post-day-2 — play the one-shot appearance sound
                try { entity.runCommandAsync("playsound mob.scary_knocker.spawn @a[r=64] ~ ~ ~ 1 1"); } catch {}
            }
        });
    }
});

// Right-click Knocker directly
world.afterEvents.playerInteractWithEntity.subscribe((event) => {
    if (event.target.typeId !== "scary:knocker") return;
    system.run(() => openMenu(event.player));
});

// Use The Whisper item from anywhere
world.afterEvents.itemUse.subscribe((event) => {
    if (event.itemStack?.typeId !== "scary:whisper") return;
    system.run(() => openMenu(event.source));
});






// ─────────────────────────────────────────────────────────────────────────────
//  BOND COMMAND  (chat: .bond <value>  or  .bond +<amount>)
//  Sets bond directly through the script so it stays in sync with the
//  scoreboard reads. External /scoreboard commands can desync on some clients.
//  Usage:  .bond        → shows current bond and tier
//          .bond 300    → sets your bond to exactly 300
//          .bond +50    → adds 50 to current bond
//          .bond -50    → subtracts 50 from current bond
// ─────────────────────────────────────────────────────────────────────────────
world.beforeEvents.chatSend.subscribe((event) => {
    const msg = event.message.trim();
    if (!msg.startsWith(".bond")) return;
    event.cancel = true;

    const player = event.sender;
    system.run(() => {
        const parts = msg.split(/\s+/);
        const arg = parts[1];
        const labels = ["Stranger","Watched","Familiar","Obsessed"];

        if (!arg) {
            const bond = getBond(player);
            const tier = getTier(bond);
            const color = bondColor(tier);
            player.sendMessage(`§8[ The Knocker ]  ${color}Bond: ${bond}/500 — ${labels[tier]}`);
            return;
        }

        const isRelative = arg.startsWith("+") || arg.startsWith("-");
        const num = parseInt(arg, 10);
        if (isNaN(num)) {
            player.sendMessage("§8[ The Knocker ]  §cUsage: .bond <value>  or  .bond +<amount>");
            return;
        }

        try {
            let obj = world.scoreboard.getObjective("bond");
            if (!obj) obj = world.scoreboard.addObjective("bond", "bond");
            if (isRelative) {
                let current = 0;
                try { current = obj.getScore(player) ?? 0; } catch {}
                obj.setScore(player, Math.max(0, Math.min(500, current + num)));
            } else {
                obj.setScore(player, Math.max(0, Math.min(500, num)));
            }
            const newBond = getBond(player);
            const tier = getTier(newBond);
            const color = bondColor(tier);
            player.sendMessage(`§8[ The Knocker ]  ${color}Bond set to ${newBond}/500 — ${labels[tier]}`);
        } catch (err) {
            player.sendMessage(`§8[ The Knocker ]  §cFailed to set bond: ${err}`);
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────
//  PACIFIST THREAT SYSTEM
//  Polls every second. When fakkel sets threatpick on a Knocker,
//  fire a threat message toward the nearest pacifist player then reset the score.
// ─────────────────────────────────────────────────────────────────────────────
system.runInterval(() => {
    try {
        const obj = world.scoreboard.getObjective("threatpick");
        if (!obj) return;
        for (const dim of ["overworld", "nether", "the_end"]) {
            let knockers;
            try { knockers = world.getDimension(dim).getEntities({ type: "scary:knocker" }); } catch { continue; }
            for (const k of knockers) {
                let score;
                try { score = obj.getScore(k); } catch { continue; }
                if (!score || score < 1) continue;
                // Find nearest pacifist player
                const players = world.getAllPlayers().filter(p => p.hasTag("k_pacifist") && p.dimension.id === dim);
                if (players.length === 0) { obj.setScore(k, 0); continue; }
                const bond = getBond(players[0]);
                const tier = getTier(bond);
                sendThreat(players[0], tier);
                obj.setScore(k, 0);
            }
        }
    } catch {}
}, 20);

