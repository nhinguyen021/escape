/* Rain-only instrument, sharing the existing sound switch and AudioContext. */
(() => {
  const notes = [261.63,293.66,329.63,349.23,392,440,493.88,523.25];
  const names = ['Đô','Rê','Mi','Fa','Sol','La','Si','Đô cao'];
  const song = [0,0,4,4,5,5,4,3,3,2,2,1,1,0];
  const quotes = [
    'Ở đây, không ai cần điều gì từ bạn.',
    'Hôm nay, chậm lại cũng là một cách bước tiếp.',
    'Không cần đàn đúng mọi nốt để tạo nên điều dễ thương.',
    'Bạn được phép nghỉ, ngay cả khi mọi thứ chưa xong.',
    'Một nốt nhỏ thôi. Một niềm vui nhỏ thôi.'
  ];
  class RainVoices {
    constructor(engine) { this.engine=engine;this.voices=[];this.volume=.6;this.lastTap=-Infinity;this.enabled=false;this.generation=0; }
    stop() {
      this.generation++;
      for(const voice of [...this.voices])voice.release();
    }
    setActive(active) { this.enabled=active;if(!active)this.stop(); }
    async play(index) {
      const engine=this.engine,ctx=engine?.ctx;
      if(!this.enabled||!engine?.isPlaying||!ctx||!notes[index]||this.volume<=0)return false;
      const now=ctx.currentTime;
      if(now-this.lastTap<.035)return false;
      this.lastTap=now;
      const generation=this.generation;
      try { if(ctx.state==='suspended')await ctx.resume(); }
      catch { return false; }
      if(generation!==this.generation||!this.enabled||!engine.isPlaying||ctx.state==='closed')return false;
      if(this.voices.length>=6)this.voices[0].release();
      const time=ctx.currentTime, gain=ctx.createGain(),filter=ctx.createBiquadFilter();
      const fundamental=ctx.createOscillator(),overtone=ctx.createOscillator(),partialGain=ctx.createGain();
      filter.type='lowpass';filter.frequency.setValueAtTime(2600,time);
      fundamental.type='triangle';fundamental.frequency.setValueAtTime(notes[index],time);
      overtone.type='sine';overtone.frequency.setValueAtTime(notes[index]*2,time);
      partialGain.gain.setValueAtTime(.16,time);
      fundamental.connect(filter);overtone.connect(partialGain);partialGain.connect(filter);
      filter.connect(gain);gain.connect(engine.masterGain);
      gain.gain.setValueAtTime(0,time);
      gain.gain.linearRampToValueAtTime(.19*this.volume,time+.012);
      gain.gain.exponentialRampToValueAtTime(.035*this.volume,time+.28);
      gain.gain.exponentialRampToValueAtTime(.0001,time+1.45);
      gain.gain.linearRampToValueAtTime(0,time+1.5);
      let released=false,cleaned=false;
      const cleanup=()=>{
        if(cleaned)return;cleaned=true;
        this.voices=this.voices.filter(v=>v!==voice);
        [fundamental,overtone,partialGain,filter,gain].forEach(n=>n.disconnect());
      };
      const voice={release:()=>{
        if(released)return;released=true;
        this.voices=this.voices.filter(v=>v!==voice);
        const t=ctx.currentTime;
        if(gain.gain.cancelAndHoldAtTime)gain.gain.cancelAndHoldAtTime(t);
        else {const value=gain.gain.value;gain.gain.cancelScheduledValues(t);gain.gain.setValueAtTime(value,t);}
        gain.gain.linearRampToValueAtTime(0,t+.02);
        fundamental.stop(t+.025);overtone.stop(t+.025);
      }};
      fundamental.onended=cleanup;
      this.voices.push(voice);
      fundamental.start(time);overtone.start(time);
      fundamental.stop(time+1.52);overtone.stop(time+1.52);
      return true;
    }
  }
  window.RainVoices=RainVoices;
  window.createRainPiano=({engine,room})=>{
    const $=id=>document.getElementById(id);
    const keys=[...room.querySelectorAll('[data-rain-note]')];
    const voices=new RainVoices(engine),status=$('rain-piano-status'),guide=$('rain-guide'),quote=$('rain-quote');
    let active=false,practice=false,step=0,quoteIndex=0,request=0;
    const visualTimers=new Map();
    function practiceUI() {
      keys.forEach((key,i)=>key.classList.toggle('is-next',practice&&song[step]===i));
      guide.setAttribute('aria-pressed',String(practice));
      $('rain-guide-progress').textContent=practice?`Twinkle, Twinkle · ${step+1}/${song.length} · tiếp theo: ${names[song[step]]}`:'Tập câu đầu “Twinkle, Twinkle, Little Star” theo giọt được đánh dấu.';
    }
    async function tap(index) {
      if(!active||document.hidden||!keys[index])return;
      const token=++request,key=keys[index];
      clearTimeout(visualTimers.get(index));
      key.classList.remove('is-struck');void key.offsetWidth;key.classList.add('is-struck');
      visualTimers.set(index,setTimeout(()=>{key.classList.remove('is-struck');visualTimers.delete(index);},500));
      if(!engine?.isPlaying){status.textContent='Bật âm thanh ở góc trên để nghe piano.';return;}
      if(voices.volume<=0){status.textContent='Tăng âm lượng piano để nghe các nốt.';return;}
      const played=await voices.play(index);
      if(!active||token!==request)return;
      if(!played){status.textContent='Chạm chậm một chút để từng nốt ngân lên.';return;}
      status.textContent=`${names[index]} ♪`;
      if(practice){
        if(index===song[step]){
          step++;
          if(step===song.length){practice=false;step=0;status.textContent='Bạn vừa đàn xong một câu nhạc. Dễ thương rồi đó!';quote.textContent=quotes[2];}
          practiceUI();
        }else status.textContent=`Không sao, thử nốt ${names[song[step]]} nhé.`;
      }
    }
    keys.forEach((key,index)=>key.addEventListener('click',()=>tap(index)));
    document.addEventListener('keydown',event=>{
      if(!active||room.inert||event.repeat||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
      if(event.target.closest('input, textarea, select, [contenteditable="true"]'))return;
      if(document.querySelector('#letter-modal.active'))return;
      if(/^[1-8]$/.test(event.key)){event.preventDefault();tap(Number(event.key)-1);}
    });
    guide.addEventListener('click',()=>{practice=!practice;step=0;practiceUI();});
    $('rain-change-quote').addEventListener('click',()=>{quoteIndex=(quoteIndex+1)%quotes.length;quote.textContent=quotes[quoteIndex];});
    $('rain-piano-volume').addEventListener('input',event=>{
      voices.volume=Number(event.target.value)/100;
      $('rain-piano-volume-value').textContent=`${event.target.value}%`;
      if(voices.volume===0)voices.stop();
    });
    document.addEventListener('visibilitychange',()=>{
      room.classList.toggle('rr-paused',document.hidden);
      if(document.hidden){request++;voices.stop();}
    });
    practiceUI();
    return {
      setActive(value){active=value;voices.setActive(value);if(!value){request++;for(const t of visualTimers.values())clearTimeout(t);visualTimers.clear();keys.forEach(k=>k.classList.remove('is-struck'));}},
      syncAudio(){if(!engine?.isPlaying){request++;voices.stop();}status.textContent=engine?.isPlaying?'Chạm các giọt mưa hoặc dùng phím 1–8.':'Bật âm thanh ở góc trên để nghe piano.';}
    };
  };
})();
