from setuptools import setup

setup(
    name='oangia',
    version='0.1',
    install_requires=[
    ],
    extras_require={
        'youtube': ['yt-dlp', 'webvtt-py'],
        'video': ['pydub', 'moviepy==1.0.3'],
        'tts': ['gTTS', 'SpeechRecognition'],
        'all': ['pytest', 'black', 'torch'],
        'gg_sheet': ['gspread', 'pandas']
    }
)
