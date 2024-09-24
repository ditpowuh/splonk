# splonk

A Node.JS web application that is based on Kahoot, with more of a focus on having fun rather than learning.
<br>
**Designed for the host to run locally!**
This project was originally made to be used to have fun with my friends.
<br>
Users can join if they are on the same network. If this is not the case (i.e. the host is screensharing their Splonk), the host may have to use port forwarding to ensure joinability.

#### Path to Games
All games are stored in a folder named `games`.
<br>
An example of a path to a game would be:
`games/[FILE NAME].json`

#### Formatting and Structure Guide
See the [example](#example) if required.
##### For each game...
<br>

`title`
<br>
**Compulsory.** The title of the game.

`questions`
<br>
**Compulsory.** The list of questions.

##### For each question...
<br>

`question`
<br>
**Compulsory.** The question that is to be displayed on the screen.

`options`
<br>
**Compulsory.** The available options for the given question. Minimum of 1 as the length, with 4 being the max.

`answers`
<br>
**Compulsory.** The answer(s) to the question. Minimum of 1 as the length, with 4 being the max.

`time`
<br>
The time allowed for the question. Default is 15.

`pointMultiplier`
<br>
Modifies the amount of points awarded for the question.

#### Types of Questions
Single Response Question: The standard, where the user can only select one option. This is automatically identified when `answers` only has one item.

Multiple Response Question: When `answers` has more than one item, the question is considered a multiple response question and users will be able to select multiple options.

Trick Questions: When `answers` has only `null`, it sets the question to have no answer (points are only awarded if users do not select any options). This can be used in combination with single response or multiple response.

#### <a name="example"></a>Example Game
This is an example game that showcases various features (Note that some of these questions are based on my friends' opinions and interests and is not indicative of my opinions or interests).

```json
{
  "title": "Example Game",
  "questions": [
    {
      "question": "What is the name of this web application?",
      "options": [
        "Splonk",
        "Kahoot"
      ],
      "answers": [
        "Splonk"
      ],
      "time": 5
    },
    {
      "question": "In Zootopia, Nick Wilde is what kind of animal?",
      "options": [
        "Rabbit",
        "Bear",
        "Fox",
        "Sheep"
      ],
      "answers": [
        "Fox"
      ]
    },
    {
      "question": "Which is the more fun game?",
      "options": [
        "Overwatch 2",
        "Valorant",
        "League of Legends",
        "CS2"
      ],
      "answers": [
        null
      ],
      "time": 10
    }
  ]
}
```

#### Point System
The amount of points that is awarded is relative to the time (e.g. if a user answers 5 seconds after, in a 10 second question, the user is awarded 50% of 1000 points). For answer streaks, bonus points are awarded depending on the length of the streak, where there is an increase of 1% additively (e.g. a streak of 2 will yield a 1% increase of bonus points and a streak of 7 will yield a 6% increase of bonus points).
