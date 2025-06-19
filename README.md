## Web page and python package
### Youtube
```
import oangia.Youtube as yt

yt.download("kc90thvBc7c")
print(yt.download_transcript("__nlupHISg0"))
print(yt.vtt_to_text("transcript.en.vtt"))
info = yt.download_channel('TEDEd')
for entry in info['entries']:
  print(entry['title'], entry['view_count']//1000000)
len(info['entries'])
yt.download_audio("kb-aW78puWM")
```
### Poker
```

```
