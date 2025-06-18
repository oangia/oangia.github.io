from setuptools import setup

setup(
    name='oangia',
    version='0.1',
    install_requires=[
        'yt-dlp',
        'webvtt-py',
        'pydub',
        'gTTS',
        'SpeechRecognition',
        'moviepy==1.0.3',
        'gspread',
        'pandas'
    ]
)
