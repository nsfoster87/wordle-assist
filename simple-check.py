import re

with open('./wordle-answers-alphabetical.txt', 'r') as file:
    wordlist = []
    for word in file:
        wordlist.append(word.strip())

newWordList = []
print('starting wordlist count:')
print(len(wordlist))

print('1. pride:')
for word in wordlist:
    if "p" in word or "r" in word or "d" in word or "e" in word or "i" not in word or re.match(r'\w\wi\w\w', word):
        continue
    else:
        newWordList.append(word)
print(len(newWordList))
for word in newWordList:
    print(word)

print('2. fight:')
anotherNewList = []
for word in newWordList:
    if "f" in word or "g" in word or "h" in word or "t" in word or re.match(r'\wi\w\w\w', word):
        continue
    else:
        anotherNewList.append(word)

print(len(anotherNewList))
for word in anotherNewList:
    print(word)

print('3. snail:')
fourthList = []
for word in anotherNewList:
    if "s" in word or "a" in word or "l" in word:
        continue
    elif not re.match(r'\w\w\wi\w', word):
        continue
    elif "n" not in word:
        continue
    elif re.match(r'\wn\w\w\w', word):
        continue
    else:
        fourthList.append(word)
print(len(fourthList))
for word in fourthList:
    print(word)