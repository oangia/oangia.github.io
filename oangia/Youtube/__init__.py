import yt_dlp
import webvtt
import os

def download(id, quality = "best"):
    url = "https://www.youtube.com/watch?v=" + id
    
    ydl_opts = {
        'format': quality,
        'outtmpl': '%(title)s.%(ext)s',
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
        
def download_channel(channel):
    channel_url = 'https://www.youtube.com/@' + channel +'/videos'
    
    ydl_opts = {
        'extract_flat': True,
        'quiet': True,
        'skip_download': True,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(channel_url, download=False)
    
    return info

def download_audio(id):
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': 'audio.%(ext)s',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download(["https://www.youtube.com/watch?v=" + id])

def download_transcript(id):
    url = 'https://www.youtube.com/watch?v=' + id

    # Set up yt_dlp options
    ydl_opts = {
        'skip_download': True,
        'writesubtitles': True,         # download manual subtitles if available
        'writeautomaticsub': True,      # fallback to auto subtitles if manual not available
        'subtitleslangs': ['en'],       # target English only
        'subtitlesformat': 'vtt',
        'outtmpl': 'transcript.%(ext)s',
        'quiet': True,
    }
    
    # Download subtitles
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)

    return vtt_to_text("transcript.en.vtt")

def vtt_to_text(filepath):
    transcript = []
    for caption in webvtt.read(filepath):
        transcript.append(caption.text.replace("\n", " "))
    new_trans = [transcript[0]]
    for i in range(1, len(transcript)):
        if transcript[i] != new_trans[-1]:
            #print("com", transcript[i], "second", new_trans[-1])
            new_trans.append(transcript[i])
    return '\n'.join(new_trans)
