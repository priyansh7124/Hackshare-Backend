#include <bits/stdc++.h>
using namespace std;
#define ll long long
#define vi vector<int>
#define vpi vector<pair<ll,ll>>
#define vii vector<vector<int>>
#define ld long double
#define sza(x) ((int)x.size())
#define ff first
#define all(a) (a).begin(), (a).end()
#define allr(a) (a).rbegin(), (a).rend()
#define ss second
#define pb push_back


int solve2(string str1, string str2 , int m , int n , int x){
    if (m > str2.size())
        return x;
    if (n > str1.size())
        return -1;
 
    if (x==-1 && str1[m - 1] == str2[n - 1])
        return solve2(str1, str2, m - 1, n - 1 , n);

    return solve2(str1, str2, m, n - 1,x);
}

int solve(string a, string b){
    int aa = a.size();
    int bb = b.size();
    for(int i=0;i<bb;i++){
        char original = b[i];
        for(char x ='a' ; x<'z';x++){
            b[i]=x;
            int k = solve2(a,b,0,0,-1);
            if(k!=-1) return k;
        }
        b[i]=original;
    }
    return -1;
}

int main(){
    ios_base::sync_with_stdio(0);
    cin.tie(0); cout.tie(0);
    int x = solve("cabac","cbc");
}